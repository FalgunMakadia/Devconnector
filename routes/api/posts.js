const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');
const { check, validationResult } = require('express-validator');

// @route   POST api/posts
// @desc    Create a new Post
// @access  Private
router.post(
  '/',
  [auth, [check('text', 'Text is required!').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id);

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (e) {
      console.error(e.message);
      res.status(500).send('Server Error!');
    }
  }
);

// @route   GET api/posts
// @desc    Get all Posts
// @access  Private

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error!');
  }
});

// @route   GET api/posts/:post_id
// @desc    Get a post by ID
// @access  Private

router.get('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not Found!' });
    }
    res.json(post);
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not Found!' });
    }
    res.status(500).send('Server Error!');
  }
});

// @route   DELETE api/posts/:post_id
// @desc    Delete a post by ID
// @access  Private

router.delete('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not Found!' });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not Authorized!' });
    }

    await post.remove();

    res.json({ msg: 'Post Removed!' });
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not Found!' });
    }
    res.status(500).send('Server Error!');
  }
});

// @route   PUT api/posts/like/:post_id
// @desc    Like a post by ID
// @access  Private

router.put('/like/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    const user = await User.findById(req.user.id);

    // Check if the logged in user has already liked the post
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked!' });
    }

    post.likes.unshift({ user: req.user.id, name: user.name });
    await post.save();

    res.json(post.likes);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error!');
  }
});

// @route   PUT api/posts/unlike/:post_id
// @desc    Unlike a post by ID
// @access  Private

router.put('/unlike/:post_id', auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.post_id);

    // Check if the post has already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has not been liked yet!' });
    }

    //Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id); // <-- here
    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error!');
  }
});

// @route   POST api/posts/comment/:post_id
// @desc    Comment on a post
// @access  Private

router.post(
  '/comment/:post_id',
  [auth, [check('text', 'Text is required!').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id);
      const post = await Post.findById(req.params.post_id);

      const { text } = req.body;
      const newComment = {
        user: req.user.id,
        text,
        name: user.name,
        avatar: user.avatar,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (e) {
      console.error(e.message);
      res.status(500).send('Server Error!');
    }
  }
);

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Delete a comment
// @access  Private

router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    // Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // Check if comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist!' });
    }

    // Check if the same user has created to comment who wants to delete it
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not Authorized!' });
    }

    // Get index of the comment we want to delete
    const removeIndex = post.comments
      .map((comment) => comment.idnpm.toString())
      .indexOf(req.params.comment_id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error!');
  }
});

module.exports = router;
