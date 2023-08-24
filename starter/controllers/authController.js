const jwt = require('jsonwebtoken');
const User = require('./../model/userModel');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);

    const token = signToken(newUser._id);
    res.status(201).json({
      token,
      status: 'success',
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  //1) Check if email and pasword exist
  if (!email || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide email and password',
    });
  }
  //2) Check if user exists && password exist
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(400).json({
      status: 'fail',
      message: 'Incorrect email or password',
    });
  }
  //3) If everyone ok, send token to the client
  const token = signToken(user._id);
  return res.status(200).json({
    status: 'success',
    token,
  });
};

exports.forgotPassword = async (req, res, next) => {
  //1) Get user based on  POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({
      message: 'There is no user with this email address',
    });
  }

  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3)Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? submit a PATCH request with you new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your passwrod reset token (valid for 10 min) ',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordRestToken = undefined;
    user.passwordRestExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);

    return res.status(500).json({
      status: 'fail',
      message: 'There was an error sending the email. Try again later!',
    });
  }
};

exports.resetPassword = (req, res, next) => {};
