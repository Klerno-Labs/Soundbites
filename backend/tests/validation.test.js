const { validate } = require('../middleware/validation');
const { validationResult } = require('express-validator');

describe('Validation Middleware', () => {
    it('should be a function', () => {
        expect(typeof validate).toBe('function');
    });

    it('should call next() when no validation errors', () => {
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        // Mock validationResult to return no errors
        const mockValidationResult = jest.fn().mockReturnValue({
            isEmpty: () => true,
            array: () => []
        });

        validate(req, res, next);

        // Since validationResult returns empty, next should be called
        expect(next).toHaveBeenCalled();
    });
});
