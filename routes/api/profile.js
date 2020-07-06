const express = require('express');
const auth = require('../../middleware/auth');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/me
// @desc    Get current user
// @access  Private ==> User auth middleware/We use this when we want our route to be protected
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res
        .status(400)
        .json({ msg: 'There is no profile for this user!' });
    }

    res.json(profile);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private ==> User auth middleware/We use this when we want our route to be protected

router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required!').not().isEmpty(),
      check('skills', 'Skills is required!').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Build Profile Object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(',').map((skills) => skills.trim());
    }

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // Update profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      // Create Profile
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (e) {
      console.error(e.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/profile
// @desc    Get All profiles
// @access  Public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get Profile by ID
// @access  Public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found!' });
    }

    res.json(profile);
  } catch (e) {
    console.error(e.message);
    if (e.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found!' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/profile
// @desc    Delete Profile, User and Posts
// @access  Private

router.delete('/', auth, async (req, res) => {
  try {
    // Remove Profile
    await Profile.findOneAndRemove({ user: req.user.id });

    // Remove User
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User Removed!' });
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/profile/experience
// @desc    Add an experience into profile
// @access  Private

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required!').not().isEmpty(),
      check('company', 'Company name is required!').not().isEmpty(),
      check('from', 'From Date is required!').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      from,
      to,
      location,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      from,
      to,
      location,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp); // push will work too

      await profile.save();
      res.json(profile);
    } catch (e) {
      console.error(e.message);
      res.status(500).send('Server Error!');
    }
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete an experience
// @access  Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Det index of experience to be deleted
    const removeIndex = profile.experience
      .map((xp) => xp.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error!');
  }
});

// @route   PUT api/profile/education
// @desc    Add an education into profile
// @access  Private

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required!').not().isEmpty(),
      check('degree', 'Degree is required!').not().isEmpty(),
      check('fieldofstudy', 'Field of study is required!').not().isEmpty(),
      check('from', 'From Date is required!').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);
      await profile.save();

      res.json(profile);
    } catch (e) {
      console.error(e.message);
      res.status(500).send('Server Error!');
    }
  }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete an education
// @access  Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get index of education to be deleted
    const removeIndex = profile.education
      .map((edu) => edu.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error!');
  }
});

module.exports = router;
