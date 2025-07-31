import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authRouter from './routes/auth.js'; // Import the auth routes

const app = express();
const prisma = new PrismaClient();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use('/auth', authRouter); // Mount the auth router on the /auth path

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Leads endpoints
app.get('/leads', async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;
        const skip = (page - 1) * limit;
        
        let where = {};
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        if (status) {
            where.status = status;
        }
        
        const contacts = await prisma.contact.findMany({
            where,
            include: {
                customFields: true,
                tasks: {
                    where: { status: { not: 'COMPLETED' } },
                    orderBy: { dueDate: 'asc' }
                },
                _count: {
                    select: {
                        tasks: true,
                        notes: true,
                        activities: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            skip: parseInt(skip),
            take: parseInt(limit)
        });

        const total = await prisma.contact.count({ where });

        res.json({
            contacts,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/leads/:id', authenticateToken, async (req, res) => {
    try {
        const contact = await prisma.contact.findUnique({
            where: { id: req.params.id },
            include: {
                customFields: true,
                tasks: {
                    orderBy: { createdAt: 'desc' }
                },
                notes: {
                    orderBy: { createdAt: 'desc' }
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json(contact);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/leads', authenticateToken, async (req, res) => {
    try {
        const { name, email, phone, address, status, customFields = [] } = req.body;

        const contact = await prisma.contact.create({
            data: {
                name,
                email,
                phone,
                address,
                status: status || 'NEW',
                customFields: {
                    create: customFields
                }
            },
            include: {
                customFields: true
            }
        });

        // Log activity
        await prisma.activity.create({
            data: {
                contactId: contact.id,
                type: 'NOTE',
                title: 'Contact Created',
                description: `New contact ${name} was added to the system`
            }
        });

        res.status(201).json(contact);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/leads/:id', authenticateToken, async (req, res) => {
    try {
        const { name, email, phone, address, status, customFields = [] } = req.body;
        const contactId = req.params.id;

        // Get current contact to track status changes
        const currentContact = await prisma.contact.findUnique({
            where: { id: contactId }
        });

        // Delete existing custom fields
        await prisma.contactCustomField.deleteMany({
            where: { contactId }
        });

        // Update contact
        const contact = await prisma.contact.update({
            where: { id: contactId },
            data: {
                name,
                email,
                phone,
                address,
                status,
                customFields: {
                    create: customFields
                }
            },
            include: {
                customFields: true,
                tasks: { orderBy: { createdAt: 'desc' } },
                notes: { orderBy: { createdAt: 'desc' } },
                activities: { orderBy: { createdAt: 'desc' }, take: 20 }
            }
        });

        // Log status change activity
        if (currentContact.status !== status) {
            await prisma.activity.create({
                data: {
                    contactId: contact.id,
                    type: 'STATUS_CHANGED',
                    title: 'Status Updated',
                    description: `Status changed from ${currentContact.status} to ${status}`
                }
            });
        }

        res.json(contact);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/leads/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.contact.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tasks endpoints
app.get('/leads/:leadId/tasks', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { contactId: req.params.leadId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/leads/:leadId/tasks', async (req, res) => {
    try {
        const { title, description, priority, dueDate } = req.body;

        const task = await prisma.task.create({
            data: {
                contactId: req.params.leadId,
                title,
                description,
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        // Log activity
        await prisma.activity.create({
            data: {
                contactId: req.params.leadId,
                type: 'TASK_CREATED',
                title: 'Task Created',
                description: `New task: ${title}`
            }
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/tasks/:id', async (req, res) => {
    try {
        const { title, description, status, priority, dueDate } = req.body;

        const task = await prisma.task.update({
            where: { id: req.params.id },
            data: {
                title,
                description,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        // Log completion activity
        if (status === 'COMPLETED') {
            await prisma.activity.create({
                data: {
                    contactId: task.contactId,
                    type: 'TASK_COMPLETED',
                    title: 'Task Completed',
                    description: `Task completed: ${title}`
                }
            });
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/tasks/:id', async (req, res) => {
    try {
        await prisma.task.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Notes endpoints
app.get('/leads/:leadId/notes', async (req, res) => {
    try {
        const notes = await prisma.note.findMany({
            where: { contactId: req.params.leadId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/leads/:leadId/notes', async (req, res) => {
    try {
        const { content } = req.body;

        const note = await prisma.note.create({
            data: {
                contactId: req.params.leadId,
                content
            }
        });

        // Log activity
        await prisma.activity.create({
            data: {
                contactId: req.params.leadId,
                type: 'NOTE',
                title: 'Note Added',
                description: content.substring(0, 100) + (content.length > 100 ? '...' : '')
            }
        });

        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/notes/:id', async (req, res) => {
    try {
        const { content } = req.body;

        const note = await prisma.note.update({
            where: { id: req.params.id },
            data: { content }
        });

        res.json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/notes/:id', async (req, res) => {
    try {
        await prisma.note.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Activities endpoint
app.get('/leads/:leadId/activities', async (req, res) => {
    try {
        const activities = await prisma.activity.findMany({
            where: { contactId: req.params.leadId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// All tasks endpoint
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                contact: {
                    select: { id: true, name: true }
                }
            }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Statistics endpoint
app.get('/stats', async (req, res) => {
    try {
        const totalContacts = await prisma.contact.count();
        const contactsByStatus = await prisma.contact.groupBy({
            by: ['status'],
            _count: true
        });

        const pendingTasks = await prisma.task.count({
            where: { status: { not: 'COMPLETED' } }
        });

        res.json({
            totalContacts,
            contactsByStatus,
            pendingTasks
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint to check request body
app.post('/debug', (req, res) => {
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    res.json({
        headers: req.headers,
        body: req.body,
        contentType: req.get('Content-Type')
    });
});

// Additional login endpoint (if not handled by authRouter)
app.post('/auth/login', async (req, res) => {
    try {
        console.log('Login request body:', req.body);
        console.log('Content-Type:', req.get('Content-Type'));

        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required',
                received: { email, password }
            });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign({ userId: user.id }, 'secret-key', { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`SoleCRM backend running on port ${PORT}`);
});