import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth.js';
import contactsRouter from './routes/contacts.js';
import usersRouter from './routes/users.js';
import userContactPropertiesRouter from './routes/userContactProperties.js';
import customPropertiesRouter from './routes/custom-properties.js';
import contactCustomFieldsRouter from './routes/contact-custom-fields.js';
import { authenticateToken } from './middleware/auth.js';
import { generalLimiter, progressiveLimiter } from './middleware/rateLimiting.js';
import { cleanupExpiredTokens } from './utils/tokenUtils.js';

const app = express();
// Trust the first proxy (needed for correct client IP detection behind proxies)
app.set('trust proxy', 1);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

console.log('🚀 Starting SoleCRM Backend');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log('🗄️ Database URL:', process.env.DATABASE_URL ? 'Configured' : 'Not configured');

// Security check
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
    console.error('❌ CRITICAL: JWT_SECRET environment variable must be set to a secure value!');
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

// Test database connection on startup
prisma.$connect()
    .then(() => {
        console.log('✅ Database connected successfully');
        
        // Setup periodic cleanup of expired refresh tokens
        const cleanupInterval = setInterval(() => {
            const cleanedCount = cleanupExpiredTokens();
            if (cleanedCount > 0) {
                console.log(`🧹 Cleaned up ${cleanedCount} expired refresh tokens`);
            }
        }, 60 * 60 * 1000); // Run every hour
        
        // Clear interval on process exit
        process.on('SIGTERM', () => {
            clearInterval(cleanupInterval);
        });
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    });

// Enhanced security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    xssFilter: true,
    noSniff: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    ieNoOpen: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "same-origin" }
}));

// CORS configuration
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3001' // Add support for alternative port
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Apply rate limiting
app.use('/api/', progressiveLimiter);

// Mount auth routes (no authentication required)
app.use('/api/auth', authRouter);

// Mount protected routes (authentication required)

app.use('/api/users', usersRouter);
app.use('/api/contacts', contactsRouter);

app.use('/api/user-contact-properties', userContactPropertiesRouter);
app.use('/api/custom-properties', customPropertiesRouter);
app.use('/api/contacts', contactCustomFieldsRouter);

// Tasks endpoints
app.get('/api/leads/:leadId/tasks', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const leadId = req.params.leadId;

        // Verify contact ownership
        const contact = await prisma.contact.findFirst({
            where: { id: leadId, userId },
            select: { id: true }
        });

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                code: 'CONTACT_NOT_FOUND'
            });
        }

        const tasks = await prisma.task.findMany({
            where: { contactId: leadId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ 
            error: 'Failed to fetch tasks',
            code: 'FETCH_TASKS_ERROR'
        });
    }
});

app.post('/api/leads/:leadId/tasks', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const leadId = req.params.leadId;
        const { title, description, priority, dueDate } = req.body;

        // Verify contact ownership
        const contact = await prisma.contact.findFirst({
            where: { id: leadId, userId },
            select: { id: true }
        });

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                code: 'CONTACT_NOT_FOUND'
            });
        }

        if (!title || title.trim() === '') {
            return res.status(400).json({ 
                error: 'Title is required',
                code: 'TITLE_REQUIRED'
            });
        }

        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        if (priority && !validPriorities.includes(priority.toUpperCase())) {
            return res.status(400).json({
                error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
                code: 'INVALID_PRIORITY'
            });
        }

        const task = await prisma.task.create({
            data: {
                contactId: leadId,
                userId,
                title: title.trim(),
                description: description ? description.trim() : null,
                priority: priority ? priority.toUpperCase() : 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        // Log activity
        await prisma.activity.create({
            data: {
                contactId: leadId,
                type: 'TASK_CREATED',
                title: 'Task Created',
                description: `New task: ${title}`
            }
        });

        console.log('Task created successfully:', task.id);
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ 
            error: 'Failed to create task',
            code: 'CREATE_TASK_ERROR'
        });
    }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        const { title, description, status, priority, dueDate } = req.body;

        // Verify task ownership
        const existingTask = await prisma.task.findFirst({
            where: { 
                id: taskId,
                OR: [
                    { userId },
                    { contact: { userId } }
                ]
            }
        });

        if (!existingTask) {
            return res.status(404).json({ 
                error: 'Task not found',
                code: 'TASK_NOT_FOUND'
            });
        }

        if (!title || title.trim() === '') {
            return res.status(400).json({ 
                error: 'Title is required',
                code: 'TITLE_REQUIRED'
            });
        }

        const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

        if (status && !validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                code: 'INVALID_STATUS'
            });
        }

        if (priority && !validPriorities.includes(priority.toUpperCase())) {
            return res.status(400).json({
                error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
                code: 'INVALID_PRIORITY'
            });
        }

        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                title: title.trim(),
                description: description ? description.trim() : null,
                status: status ? status.toUpperCase() : existingTask.status,
                priority: priority ? priority.toUpperCase() : existingTask.priority,
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        // Log completion activity if status changed to completed
        if (status && status.toUpperCase() === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
            await prisma.activity.create({
                data: {
                    contactId: task.contactId,
                    type: 'TASK_COMPLETED',
                    title: 'Task Completed',
                    description: `Task completed: ${title}`
                }
            });
        }

        console.log('Task updated successfully:', task.id);
        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ 
            error: 'Failed to update task',
            code: 'UPDATE_TASK_ERROR'
        });
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;

        // Verify task ownership
        const existingTask = await prisma.task.findFirst({
            where: { 
                id: taskId,
                OR: [
                    { userId },
                    { contact: { userId } }
                ]
            }
        });

        if (!existingTask) {
            return res.status(404).json({ 
                error: 'Task not found',
                code: 'TASK_NOT_FOUND'
            });
        }

        await prisma.task.delete({
            where: { id: taskId }
        });

        console.log('Task deleted successfully:', taskId);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ 
            error: 'Failed to delete task',
            code: 'DELETE_TASK_ERROR'
        });
    }
});

// Notes endpoints
app.get('/api/leads/:leadId/notes', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const leadId = req.params.leadId;

        // Verify contact ownership
        const contact = await prisma.contact.findFirst({
            where: { id: leadId, userId },
            select: { id: true }
        });

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                code: 'CONTACT_NOT_FOUND'
            });
        }

        const notes = await prisma.note.findMany({
            where: { contactId: leadId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ 
            error: 'Failed to fetch notes',
            code: 'FETCH_NOTES_ERROR'
        });
    }
});

app.post('/api/leads/:leadId/notes', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const leadId = req.params.leadId;
        const { content } = req.body;

        // Verify contact ownership
        const contact = await prisma.contact.findFirst({
            where: { id: leadId, userId },
            select: { id: true }
        });

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                code: 'CONTACT_NOT_FOUND'
            });
        }

        if (!content || content.trim() === '') {
            return res.status(400).json({ 
                error: 'Content is required',
                code: 'CONTENT_REQUIRED'
            });
        }

        const note = await prisma.note.create({
            data: {
                contactId: leadId,
                content: content.trim()
            }
        });

        // Log activity
        await prisma.activity.create({
            data: {
                contactId: leadId,
                type: 'NOTE',
                title: 'Note Added',
                description: content.substring(0, 100) + (content.length > 100 ? '...' : '')
            }
        });

        console.log('Note created successfully:', note.id);
        res.status(201).json(note);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ 
            error: 'Failed to create note',
            code: 'CREATE_NOTE_ERROR'
        });
    }
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const noteId = req.params.id;
        const { content } = req.body;

        // Verify note ownership through contact
        const existingNote = await prisma.note.findFirst({
            where: { 
                id: noteId,
                contact: { userId }
            }
        });

        if (!existingNote) {
            return res.status(404).json({ 
                error: 'Note not found',
                code: 'NOTE_NOT_FOUND'
            });
        }

        if (!content || content.trim() === '') {
            return res.status(400).json({ 
                error: 'Content is required',
                code: 'CONTENT_REQUIRED'
            });
        }

        const note = await prisma.note.update({
            where: { id: noteId },
            data: { content: content.trim() }
        });

        console.log('Note updated successfully:', note.id);
        res.json(note);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ 
            error: 'Failed to update note',
            code: 'UPDATE_NOTE_ERROR'
        });
    }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const noteId = req.params.id;

        // Verify note ownership through contact
        const existingNote = await prisma.note.findFirst({
            where: { 
                id: noteId,
                contact: { userId }
            }
        });

        if (!existingNote) {
            return res.status(404).json({ 
                error: 'Note not found',
                code: 'NOTE_NOT_FOUND'
            });
        }

        await prisma.note.delete({
            where: { id: noteId }
        });

        console.log('Note deleted successfully:', noteId);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ 
            error: 'Failed to delete note',
            code: 'DELETE_NOTE_ERROR'
        });
    }
});

// Activities endpoint
app.get('/api/leads/:leadId/activities', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const leadId = req.params.leadId;

        // Verify contact ownership
        const contact = await prisma.contact.findFirst({
            where: { id: leadId, userId },
            select: { id: true }
        });

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                code: 'CONTACT_NOT_FOUND'
            });
        }

        const activities = await prisma.activity.findMany({
            where: { contactId: leadId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ 
            error: 'Failed to fetch activities',
            code: 'FETCH_ACTIVITIES_ERROR'
        });
    }
});

// All tasks endpoint
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, priority, page = 1, limit = 50 } = req.query;

        const where = {
            OR: [
                { userId },
                { contact: { userId } }
            ]
        };

        if (status) {
            where.status = status.toUpperCase();
        }

        if (priority) {
            where.priority = priority.toUpperCase();
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const [tasks, totalCount] = await Promise.all([
            prisma.task.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: parseInt(limit),
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    priority: true,
                    dueDate: true,
                    createdAt: true,
                    updatedAt: true,
                    contactId: true,
                    contact: {
                        select: { 
                            id: true, 
                            name: true 
                        }
                    }
                }
            }),
            prisma.task.count({ where })
        ]);

        res.json({
            tasks,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching all tasks:', error);
        res.status(500).json({ 
            error: 'Failed to fetch tasks',
            code: 'FETCH_ALL_TASKS_ERROR'
        });
    }
});

// Statistics endpoint
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [totalContacts, contactsByStatus, pendingTasks, totalTasks] = await Promise.all([
            prisma.contact.count({
                where: { userId }
            }),
            prisma.contact.groupBy({
                by: ['status'],
                where: { userId },
                _count: true
            }),
            prisma.task.count({
                where: { 
                    status: { not: 'COMPLETED' },
                    OR: [
                        { userId },
                        { contact: { userId } }
                    ]
                }
            }),
            prisma.task.count({
                where: {
                    OR: [
                        { userId },
                        { contact: { userId } }
                    ]
                }
            })
        ]);

        res.json({
            totalContacts,
            contactsByStatus,
            pendingTasks,
            totalTasks
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch statistics',
            code: 'FETCH_STATS_ERROR'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Global error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(isDevelopment && { details: error.message, stack: error.stack })
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
        path: req.path,
        method: req.method 
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 SoleCRM backend running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️ Database: Connected`);
    console.log(`🔐 Auth: ${process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-secret-key' ? 'Secured' : '⚠️  Using default secret!'}`);
});