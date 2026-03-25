const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Send a message
router.post('/send', async (req, res) => {
    try {
        const { sender_id, receiver_id, message } = req.body;

        // Insert message
        const [result] = await db.query(
            'INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
            [sender_id, receiver_id, message]
        );

        // Update or create conversation
        const [existingConv] = await db.query(
            'SELECT id FROM chat_conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
            [sender_id, receiver_id, receiver_id, sender_id]
        );

        if (existingConv.length > 0) {
            await db.query(
                'UPDATE chat_conversations SET last_message = ?, last_message_time = NOW() WHERE id = ?',
                [message, existingConv[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO chat_conversations (user1_id, user2_id, last_message, last_message_time) VALUES (?, ?, ?, NOW())',
                [sender_id, receiver_id, message]
            );
        }

        res.status(201).json({ 
            success: true, 
            message: 'Message sent',
            messageId: result.insertId 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get conversation between two users
router.get('/conversation/:user1Id/:user2Id', async (req, res) => {
    try {
        const { user1Id, user2Id } = req.params;

        const [messages] = await db.query(
            `SELECT * FROM chat_messages 
             WHERE (sender_id = ? AND receiver_id = ?) 
                OR (sender_id = ? AND receiver_id = ?) 
             ORDER BY created_at ASC`,
            [user1Id, user2Id, user2Id, user1Id]
        );

        // Mark messages as read
        await db.query(
            'UPDATE chat_messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ?',
            [user1Id, user2Id]
        );

        res.json(messages);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's conversations
router.get('/conversations/:userId', async (req, res) => {
    try {
        const [conversations] = await db.query(
            `SELECT c.*, 
                    u1.name as user1_name, u1.id as user1_id,
                    u2.name as user2_name, u2.id as user2_id,
                    (SELECT COUNT(*) FROM chat_messages WHERE receiver_id = ? AND sender_id = c.user2_id AND is_read = FALSE) as unread_count
             FROM chat_conversations c
             JOIN users u1 ON c.user1_id = u1.id
             JOIN users u2 ON c.user2_id = u2.id
             WHERE c.user1_id = ? OR c.user2_id = ?
             ORDER BY c.updated_at DESC`,
            [req.params.userId, req.params.userId, req.params.userId]
        );

        // Format conversations for response
        const formatted = conversations.map(conv => {
            const otherUser = conv.user1_id == req.params.userId ? 
                { id: conv.user2_id, name: conv.user2_name } : 
                { id: conv.user1_id, name: conv.user1_name };
            
            return {
                id: conv.id,
                otherUser,
                lastMessage: conv.last_message,
                lastMessageTime: conv.last_message_time,
                unreadCount: conv.unread_count
            };
        });

        res.json(formatted);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get unread message count
router.get('/unread/:userId', async (req, res) => {
    try {
        const [result] = await db.query(
            'SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = ? AND is_read = FALSE',
            [req.params.userId]
        );

        res.json({ unreadCount: result[0].count });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;