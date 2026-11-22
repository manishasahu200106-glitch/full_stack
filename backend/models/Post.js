const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a blog title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    content: {
      type: String,
      required: [true, 'Please add blog content']
    },
    author: {
      type: String,
      required: [true, 'Please specify an author'],
      default: 'Anonymous',
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['Technology', 'Cloud & DevOps', 'Web Development', 'React', 'General'],
      default: 'Technology'
    },
    tags: {
      type: [String],
      default: []
    },
    likes: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Post', postSchema);
