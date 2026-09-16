const mongoose = require('mongoose');

const aiHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    threadId: {
        type: String,
        required: true,
        index: true
    },
    state: {
        type: Object, // Stores the LangGraph state checkpoint
        required: true
    },
    metadata: {
        type: Object
    }
}, { timestamps: true });

module.exports = mongoose.model('AIHistory', aiHistorySchema);
