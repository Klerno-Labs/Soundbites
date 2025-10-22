const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Login validation rules
const loginValidation = [
    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email format'),
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Username must be 3-100 characters'),
    body('password')
        .exists()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    validate
];

// Quiz submission validation
const quizSubmissionValidation = [
    body('score')
        .isInt({ min: 0, max: 100 })
        .withMessage('Score must be between 0 and 100'),
    body('answers')
        .isArray()
        .withMessage('Answers must be an array'),
    body('utm_source')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('UTM source too long'),
    body('utm_medium')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('UTM medium too long'),
    body('utm_campaign')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('UTM campaign too long'),
    validate
];

// Lead capture validation
const leadCaptureValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('name')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Name too long'),
    body('phone')
        .optional()
        .trim()
        .matches(/^[\d\s\+\-\(\)]+$/)
        .withMessage('Invalid phone number format')
        .isLength({ max: 50 })
        .withMessage('Phone number too long'),
    validate
];

// Question creation validation
const questionValidation = [
    body('question')
        .trim()
        .notEmpty()
        .withMessage('Question text is required')
        .isLength({ max: 1000 })
        .withMessage('Question too long'),
    body('type')
        .isIn(['multiple-choice', 'yes-no', 'slider', 'hours-slider', 'text'])
        .withMessage('Invalid question type'),
    body('weight')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Weight must be between 0 and 100'),
    validate
];

module.exports = {
    validate,
    loginValidation,
    quizSubmissionValidation,
    leadCaptureValidation,
    questionValidation
};
