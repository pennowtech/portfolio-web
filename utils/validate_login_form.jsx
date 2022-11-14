import validator from 'validator';
import _ from 'lodash';

const validateAndSanitizeLoginForm = (data) => {
  const errors = {};
  const sanitizedData = {};

  /**
     * Checks for error if required is true
     * and adds Error and Sanitized data to the errors and sanitizedData object respectively.
     *
     * @param {String} fieldName Field name e.g. First name, last name
     * @param {String} fieldDisplay field name to display in error
     *  e.g. 'Password' when actual field is 'pwd'
     * @param {Integer} min Minimum characters required
     * @param {Integer} max Maximum characters required
     * @param {String} type Type e.g. email, phone etc.
     * @param {boolean} required Required if required is passed as false,
     * it will not validate error and just do sanitization.
     */
  const validateAndSanitize = (fieldName, fieldDisplay, min, max, required, type = '') => {
    errors[fieldName] = '';
    if (required && (data[fieldName] === undefined || validator.isEmpty(data[fieldName]))) {
      errors[fieldName] = `${fieldDisplay} is required`;
      return;
    }

    if (type === 'email' && !validator.isEmail(data[fieldName])) {
      errors[fieldName] = `Invalid ${fieldDisplay}`;
      return;
    }

    //  Check for error and if there is no error then sanitize data.
    if (!validator.isLength(data[fieldName], { min, max })) {
      errors[fieldName] = `${fieldDisplay} must be ${min} to ${max} characters`;
      return;
    }

    // If no errors
    if (!errors[fieldName]) {
      sanitizedData[fieldName] = validator.trim(data[fieldName]);
      sanitizedData[fieldName] = validator.escape(sanitizedData[fieldName]);
    }
  };

  // validateAndSanitize('email', 'Email', 10, 35, true, 'email');
  validateAndSanitize('email', 'Email', 10, 35, true);
  validateAndSanitize('pwd', 'Password', 6, 35, true);

  return {
    sanitizedData,
    errors,
    isValid: _.isEmpty(errors.email) && _.isEmpty(errors.pwd),
  };
};

export default validateAndSanitizeLoginForm;
