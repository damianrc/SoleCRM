import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateUniqueContactId } from '../utils/idGenerator.js';
import { authenticateToken, validateResourceOwnership } from '../middleware/auth.js';
import { bulkOperationLimiter, uploadLimiter } from '../middleware/rateLimiting.js';
import { 
  validateBody, 
  validateQuery, 
  contactSchema, 
  contactUpdateSchema, 
  taskSchema, 
  noteSchema, 
  activitySchema,
  paginationSchema,
  contactFilterSchema,
  bulkContactsSchema,
  bulkDeleteSchema 
} from '../middleware/validation.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Extend Express Request type to include user
 */
/** @typedef {{ id: string }} AuthUser */
/** @typedef {import('express').Request & { user?: AuthUser }} AuthRequest */

// Apply authentication to all routes
router.use(authenticateToken);

// Quick health check endpoint for contacts
router.get('/health', async (req, res) => {
    try {
        const userId = req.user.id;
        const contactCount = await prisma.contact.count({ where: { userId } });
        
        res.json({
            status: 'healthy',
            contactCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ 
            status: 'unhealthy',
            error: error.message 
        });
    }
});

// GET all contacts for the authenticated user with validation
router.get('/', validateQuery(paginationSchema.merge(contactFilterSchema)), async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const contactType = typeof req.query.contactType === 'string' ? req.query.contactType : undefined;
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const page = typeof req.query.page === 'string' ? req.query.page : '1';
        const limit = typeof req.query.limit === 'string' ? req.query.limit : '100';
        // Build where clause
        const where = { userId };
        if (status) {
            where.status = status.toUpperCase();
        }
        if (contactType) {
            where.contactType = contactType.toUpperCase();
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ];
        }
        // Calculate pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        // Get contacts with pagination using select for performance
        const [contacts, totalCount] = await Promise.all([
            prisma.contact.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: parseInt(limit),
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    suburb: true,
                    contactType: true,
                    leadSource: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    tasks: {
                        select: {
                            id: true,
                            description: true,
                            status: true,
                            priority: true,
                            dueDate: true,
                            createdAt: true,
                            updatedAt: true,
                            contactId: true
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            }),
            prisma.contact.count({ where })
        ]);
        res.json({
            contacts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit))
            }
        });
    } catch (error) {
        const errMsg = (error && typeof error === 'object' && 'message' in error) ? error.message : String(error);
        res.status(500).json({ 
            error: 'Failed to fetch contacts',
            details: errMsg,
            code: 'FETCH_CONTACTS_ERROR'
        });
    }
});

// GET single contact by ID (with ownership validation)
router.get('/:id', validateResourceOwnership('contact'), async (req, res) => {
    try {
        const userId = req.user.id;
        const contactId = req.params.id;
        
        const contact = await prisma.contact.findFirst({
            where: { 
                id: contactId,
                userId 
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                suburb: true,
                contactType: true,
                leadSource: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        priority: true,
                        dueDate: true,
                        createdAt: true,
                        updatedAt: true,
                        contactId: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20 // Increased limit for better UX
                },
                notes: {
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        updatedAt: true,
                        contactId: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20 // Increased limit for better UX
                },
                activities: {
                    select: {
                        id: true,
                        type: true,
                        title: true,
                        description: true,
                        createdAt: true,
                        contactId: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50 // Reasonable limit for activities
                }
            }
        });

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                code: 'CONTACT_NOT_FOUND'
            });
        }

        res.json(contact);
    } catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({ 
            error: 'Failed to fetch contact',
            code: 'FETCH_CONTACT_ERROR'
        });
    }
});

// POST a new contact with validation
router.post('/', validateBody(contactSchema), async (req, res) => {
    try {
        const { name, email, phone, address, suburb, contactType, leadSource, status } = req.body;
        const userId = req.user.id;
        
        // Generate a unique 7-digit contact ID
        const contactId = await generateUniqueContactId(prisma);
        
        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({ 
                error: 'Name is required',
                code: 'NAME_REQUIRED'
            });
        }

        // Validate email format if provided
        if (email && email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({
                    error: 'Invalid email format',
                    code: 'INVALID_EMAIL'
                });
            }

            // Check for duplicate email
            const existingContact = await prisma.contact.findFirst({
                where: {
                    email: email.trim().toLowerCase(),
                    userId
                }
            });

            if (existingContact) {
                return res.status(409).json({ 
                    error: 'A contact with this email already exists',
                    code: 'EMAIL_EXISTS'
                });
            }
        }

        // Validate enums
        const validStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
        const validContactTypes = ['BUYER', 'SELLER', 'PAST_CLIENT', 'LEAD'];

        if (status && !validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                code: 'INVALID_STATUS'
            });
        }

        if (contactType && !validContactTypes.includes(contactType.toUpperCase())) {
            return res.status(400).json({
                error: `Invalid contact type. Must be one of: ${validContactTypes.join(', ')}`,
                code: 'INVALID_CONTACT_TYPE'
            });
        }

        const newContact = await prisma.contact.create({
            data: {
                id: contactId,
                name: name.trim(),
                email: email ? email.trim().toLowerCase() : null,
                phone: phone ? phone.trim() : null,
                address: address ? address.trim() : null,
                suburb: suburb ? suburb.trim() : null,
                contactType: contactType ? contactType.toUpperCase() : 'LEAD',
                leadSource: leadSource ? leadSource.trim() : null,
                status: status ? status.toUpperCase() : 'NEW',
                userId,
            },
        });

        console.log('Contact created successfully:', newContact.id);
        res.status(201).json(newContact);
    } catch (error) {
        console.error('Error creating contact:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ 
            error: 'Failed to create contact',
            code: 'CREATE_CONTACT_ERROR',
            details: error.message
        });
    }
});

// PUT update contact with validation
router.put('/:id', validateResourceOwnership('contact'), validateBody(contactUpdateSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const contactId = req.params.id;
        const updates = req.body;

        // Get existing contact first
        const existingContact = await prisma.contact.findFirst({
            where: { id: contactId, userId }
        });

        if (!existingContact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                code: 'CONTACT_NOT_FOUND'
            });
        }

        // For partial updates, only validate name if it's included in the update
        if ('name' in updates && (!updates.name || updates.name.trim() === '')) {
            return res.status(400).json({ 
                error: 'Name is required',
                code: 'NAME_REQUIRED'
            });
        }

        // Validate email format and check for duplicates if email is being updated
        if ('email' in updates && updates.email && updates.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updates.email.trim())) {
                return res.status(400).json({
                    error: 'Invalid email format',
                    code: 'INVALID_EMAIL'
                });
            }

            const emailLower = updates.email.trim().toLowerCase();
            if (emailLower !== existingContact.email) {
                const duplicateContact = await prisma.contact.findFirst({
                    where: {
                        email: emailLower,
                        userId,
                        id: { not: contactId }
                    }
                });

                if (duplicateContact) {
                    return res.status(409).json({ 
                        error: 'A contact with this email already exists',
                        code: 'EMAIL_EXISTS'
                    });
                }
            }
        }

        // Process updates for each field that was provided
        const processedUpdates = {};
        
        // Process each field if it exists in the updates object
        // Use Object.hasOwnProperty to check if the field is explicitly provided
        // This ensures we handle null values and empty strings correctly
        
        if ('name' in updates) {
            processedUpdates.name = updates.name ? updates.name.trim() : null;
        }
        
        if ('email' in updates) {
            processedUpdates.email = updates.email ? updates.email.trim().toLowerCase() : null;
        }
        
        if ('phone' in updates) {
            processedUpdates.phone = updates.phone ? updates.phone.trim() : null;
        }
        
        if ('address' in updates) {
            processedUpdates.address = updates.address ? updates.address.trim() : null;
        }
        
        if ('suburb' in updates) {
            processedUpdates.suburb = updates.suburb ? updates.suburb.trim() : null;
        }
        
        if ('contactType' in updates) {
            processedUpdates.contactType = updates.contactType ? updates.contactType.toUpperCase() : 'LEAD';
        }
        
        if ('leadSource' in updates) {
            processedUpdates.leadSource = updates.leadSource ? updates.leadSource.trim() : null;
        }
        
        if ('status' in updates) {
            processedUpdates.status = updates.status ? updates.status.toUpperCase() : 'NEW';
        }

        console.log('Received updates:', updates);
        console.log('Processing updates for contact:', contactId);
        console.log('Updating contact with data:', processedUpdates);
        
        const updatedContact = await prisma.contact.update({
            where: { id: contactId },
            data: processedUpdates,
        });

        console.log('Contact updated successfully:', updatedContact.id);
        res.json(updatedContact);
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ 
            error: 'Failed to update contact',
            code: 'UPDATE_CONTACT_ERROR'
        });
    }
});

// DELETE contact (with ownership validation)
router.delete('/:id', validateResourceOwnership('contact'), async (req, res) => {
    try {
        const userId = req.user.id;
        const contactId = req.params.id;

        const existingContact = await prisma.contact.findFirst({
            where: { id: contactId, userId }
        });

        if (!existingContact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                code: 'CONTACT_NOT_FOUND'
            });
        }

        await prisma.contact.delete({
            where: { id: contactId }
        });

        console.log('Contact deleted successfully:', contactId);
        res.json({ 
            message: 'Contact deleted successfully',
            id: contactId
        });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ 
            error: 'Failed to delete contact',
            code: 'DELETE_CONTACT_ERROR'
        });
    }
});

// Bulk delete contacts with validation and rate limiting
router.delete('/', validateBody(bulkDeleteSchema), bulkOperationLimiter, async (req, res) => {
    try {
        const userId = req.user.id;
        const { contactIds } = req.body;

        if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({ 
                error: 'Contact IDs are required',
                code: 'CONTACT_IDS_REQUIRED'
            });
        }

        // Verify ownership of all contacts
        const ownedContacts = await prisma.contact.findMany({
            where: {
                id: { in: contactIds },
                userId
            },
            select: { id: true }
        });

        if (ownedContacts.length !== contactIds.length) {
            return res.status(403).json({
                error: 'Some contacts do not belong to you',
                code: 'OWNERSHIP_VIOLATION'
            });
        }

        const deletedContacts = await prisma.contact.deleteMany({
            where: {
                id: { in: contactIds },
                userId
            }
        });

        console.log(`Bulk deleted ${deletedContacts.count} contacts for user ${userId}`);
        res.json({ 
            message: `Successfully deleted ${deletedContacts.count} contacts`,
            deletedCount: deletedContacts.count 
        });
    } catch (error) {
        console.error('Error bulk deleting contacts:', error);
        res.status(500).json({ 
            error: 'Failed to delete contacts',
            code: 'BULK_DELETE_ERROR'
        });
    }
});

// Bulk import contacts from CSV with validation and rate limiting
router.post('/bulk-import', validateBody(bulkContactsSchema), bulkOperationLimiter, uploadLimiter, async (req, res) => {
    try {
        const { contacts } = req.body;
        const userId = req.user.id;

        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ 
                error: 'Invalid request. Expected an array of contacts',
                code: 'INVALID_IMPORT_DATA'
            });
        }

        if (contacts.length === 0) {
            return res.status(400).json({ 
                error: 'No contacts provided for import',
                code: 'EMPTY_IMPORT'
            });
        }

        if (contacts.length > 1000) {
            return res.status(400).json({
                error: 'Too many contacts. Maximum 1000 contacts per import',
                code: 'IMPORT_TOO_LARGE'
            });
        }

        const validStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
        const validContactTypes = ['BUYER', 'SELLER', 'PAST_CLIENT', 'LEAD'];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const processedContacts = [];
        const errors = [];

        // Validate and prepare contacts
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            const row = i + 1;

            // Validate required fields
            if (!contact.name || contact.name.trim() === '') {
                errors.push({ row, field: 'name', error: 'Name is required' });
                continue;
            }

            // Validate email format
            if (contact.email && contact.email.trim() !== '' && !emailRegex.test(contact.email.trim())) {
                errors.push({ row, field: 'email', error: 'Invalid email format' });
                continue;
            }

            // Validate enums
            if (contact.status && !validStatuses.includes(contact.status.toUpperCase())) {
                errors.push({ row, field: 'status', error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
                continue;
            }

            if (contact.contactType && !validContactTypes.includes(contact.contactType.toUpperCase())) {
                errors.push({ row, field: 'contactType', error: `Invalid contact type. Must be one of: ${validContactTypes.join(', ')}` });
                continue;
            }

            const contactId = await generateUniqueContactId(prisma);
            processedContacts.push({
                id: contactId,
                name: contact.name.trim(),
                email: contact.email ? contact.email.trim().toLowerCase() : null,
                phone: contact.phone ? contact.phone.trim() : null,
                address: contact.address ? contact.address.trim() : null,
                suburb: contact.suburb ? contact.suburb.trim() : null,
                contactType: contact.contactType ? contact.contactType.toUpperCase() : 'LEAD',
                leadSource: contact.leadSource ? contact.leadSource.trim() : null,
                status: contact.status ? contact.status.toUpperCase() : 'NEW',
                userId
            });
        }

        // Return validation errors if any
        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed for some contacts',
                errors,
                validContactsCount: processedContacts.length
            });
        }

        // Check for duplicate emails within the import
        const emailMap = new Map();
        const duplicateEmails = [];
        
        processedContacts.forEach((contact, index) => {
            if (contact.email) {
                if (emailMap.has(contact.email)) {
                    duplicateEmails.push({
                        row: index + 1,
                        email: contact.email,
                        error: 'Duplicate email within import'
                    });
                } else {
                    emailMap.set(contact.email, index + 1);
                }
            }
        });

        if (duplicateEmails.length > 0) {
            return res.status(400).json({
                error: 'Duplicate emails found within import',
                duplicates: duplicateEmails
            });
        }

        // Use transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            const createdContacts = [];
            const skippedContacts = [];
            
            for (const contactData of processedContacts) {
                try {
                    // Check for existing email in database
                    if (contactData.email) {
                        const existingContact = await tx.contact.findFirst({
                            where: {
                                email: contactData.email,
                                userId
                            }
                        });

                        if (existingContact) {
                            skippedContacts.push({
                                name: contactData.name,
                                email: contactData.email,
                                reason: 'Email already exists'
                            });
                            continue;
                        }
                    }

                    const createdContact = await tx.contact.create({
                        data: contactData
                    });

                    createdContacts.push(createdContact);
                } catch (error) {
                    console.error('Error creating contact during import:', error);
                    skippedContacts.push({
                        name: contactData.name,
                        email: contactData.email,
                        reason: 'Database error'
                    });
                }
            }

            return { createdContacts, skippedContacts };
        });

        const response = {
            success: true,
            message: `Successfully imported ${result.createdContacts.length} contacts`,
            imported: result.createdContacts.length,
            skipped: result.skippedContacts.length,
            total: contacts.length,
            skippedContacts: result.skippedContacts,
            contacts: result.createdContacts
        };

        console.log(`CSV Import completed for user ${userId}:`, {
            imported: result.createdContacts.length,
            skipped: result.skippedContacts.length
        });
        
        res.status(201).json(response);

    } catch (error) {
        console.error('CSV import error:', error);
        res.status(500).json({ 
            error: 'Failed to import contacts. Please try again',
            code: 'IMPORT_ERROR'
        });
    }
});

// TASKS ENDPOINTS
// POST create a new task for a contact with validation
router.post('/:id/tasks', validateResourceOwnership('contact'), validateBody(taskSchema), async (req, res) => {
    try {
        const contactId = req.params.id;
        const userId = req.user.id;
        const { title, description, priority = 'MEDIUM', dueDate } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({
                error: 'Task title is required',
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

        const taskData = {
            contactId,
            userId,
            title: title.trim(),
            description: description ? description.trim() : null,
            priority: priority.toUpperCase(),
            status: 'PENDING'
        };

        if (dueDate) {
            taskData.dueDate = new Date(dueDate);
        }

        const task = await prisma.task.create({
            data: taskData
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            error: 'Failed to create task',
            code: 'CREATE_TASK_ERROR'
        });
    }
});

// PUT update a task with validation
router.put('/:id/tasks/:taskId', validateResourceOwnership('contact'), validateBody(taskSchema.partial()), async (req, res) => {
    try {
        const contactId = req.params.id;
        const taskId = req.params.taskId;
        const { title, description, priority, status, dueDate } = req.body;

        // Verify task belongs to contact
        const existingTask = await prisma.task.findFirst({
            where: { id: taskId, contactId }
        });

        if (!existingTask) {
            return res.status(404).json({
                error: 'Task not found',
                code: 'TASK_NOT_FOUND'
            });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description ? description.trim() : null;
        if (priority !== undefined) updateData.priority = priority.toUpperCase();
        if (status !== undefined) updateData.status = status.toUpperCase();
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: updateData
        });

        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            error: 'Failed to update task',
            code: 'UPDATE_TASK_ERROR'
        });
    }
});

// DELETE a task
router.delete('/:id/tasks/:taskId', validateResourceOwnership('contact'), async (req, res) => {
    try {
        const contactId = req.params.id;
        const taskId = req.params.taskId;

        const existingTask = await prisma.task.findFirst({
            where: { id: taskId, contactId }
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

        res.json({ message: 'Task deleted successfully', id: taskId });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            error: 'Failed to delete task',
            code: 'DELETE_TASK_ERROR'
        });
    }
});

// NOTES ENDPOINTS
// POST create a new note for a contact with validation
router.post('/:id/notes', validateResourceOwnership('contact'), validateBody(noteSchema), async (req, res) => {
    try {
        const contactId = req.params.id;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                error: 'Note content is required',
                code: 'CONTENT_REQUIRED'
            });
        }

        const note = await prisma.note.create({
            data: {
                contactId,
                content: content.trim()
            }
        });

        res.status(201).json(note);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({
            error: 'Failed to create note',
            code: 'CREATE_NOTE_ERROR'
        });
    }
});

// PUT update a note with validation
router.put('/:id/notes/:noteId', validateResourceOwnership('contact'), validateBody(noteSchema), async (req, res) => {
    try {
        const contactId = req.params.id;
        const noteId = req.params.noteId;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                error: 'Note content is required',
                code: 'CONTENT_REQUIRED'
            });
        }

        const existingNote = await prisma.note.findFirst({
            where: { id: noteId, contactId }
        });

        if (!existingNote) {
            return res.status(404).json({
                error: 'Note not found',
                code: 'NOTE_NOT_FOUND'
            });
        }

        const updatedNote = await prisma.note.update({
            where: { id: noteId },
            data: { content: content.trim() }
        });

        res.json(updatedNote);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({
            error: 'Failed to update note',
            code: 'UPDATE_NOTE_ERROR'
        });
    }
});

// DELETE a note
router.delete('/:id/notes/:noteId', validateResourceOwnership('contact'), async (req, res) => {
    try {
        const contactId = req.params.id;
        const noteId = req.params.noteId;

        const existingNote = await prisma.note.findFirst({
            where: { id: noteId, contactId }
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

        res.json({ message: 'Note deleted successfully', id: noteId });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({
            error: 'Failed to delete note',
            code: 'DELETE_NOTE_ERROR'
        });
    }
});

// ACTIVITIES ENDPOINTS
// POST create a new activity for a contact with validation
router.post('/:id/activities', validateResourceOwnership('contact'), validateBody(activitySchema), async (req, res) => {
    try {
        const contactId = req.params.id;
        const { type, title, description } = req.body;

        if (!type || !title) {
            return res.status(400).json({
                error: 'Activity type and title are required',
                code: 'TYPE_TITLE_REQUIRED'
            });
        }

        const validTypes = ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'WHATSAPP'];
        if (!validTypes.includes(type.toUpperCase())) {
            return res.status(400).json({
                error: `Invalid activity type. Must be one of: ${validTypes.join(', ')}`,
                code: 'INVALID_ACTIVITY_TYPE'
            });
        }

        const activity = await prisma.activity.create({
            data: {
                contactId,
                type: type.toUpperCase(),
                title: title.trim(),
                description: description ? description.trim() : null
            }
        });

        res.status(201).json(activity);
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({
            error: 'Failed to create activity',
            code: 'CREATE_ACTIVITY_ERROR'
        });
    }
});

// DELETE an activity
router.delete('/:id/activities/:activityId', validateResourceOwnership('contact'), async (req, res) => {
    try {
        const contactId = req.params.id;
        const activityId = req.params.activityId;

        const existingActivity = await prisma.activity.findFirst({
            where: { id: activityId, contactId }
        });

        if (!existingActivity) {
            return res.status(404).json({
                error: 'Activity not found',
                code: 'ACTIVITY_NOT_FOUND'
            });
        }

        await prisma.activity.delete({
            where: { id: activityId }
        });

        res.json({ message: 'Activity deleted successfully', id: activityId });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({
            error: 'Failed to delete activity',
            code: 'DELETE_ACTIVITY_ERROR'
        });
    }
});

export default router;