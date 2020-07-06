const express = require('express');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const router = express.Router();

// @route   GET api/auth
// @desc    Test route
// @access  Public

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (e) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth
// @desc    Authenticate User
// @access  Public

router.post(
  '/',
  [
    check('email', 'Please enter a valid Email!').isEmail(),
    check(
      'password',
      'Please Enter a password with 6 or more characters!'
    ).exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials!' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials!' }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 36000 },
        (e, token) => {
          if (e) throw e;
          res.json({ token });
        }
      );
    } catch (e) {
      console.error(e.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
