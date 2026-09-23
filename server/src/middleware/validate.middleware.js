const { AppError } = require('../utils/AppError');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message
      }));
      return next(new AppError('Dữ liệu gửi lên không hợp lệ', 422, details));
    }
    req[source] = parsed.data;
    return next();
  };
}

module.exports = { validate };
