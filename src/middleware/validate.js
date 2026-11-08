// Validates req.body against a zod schema and replaces it with the cleaned result.
// Unknown fields are dropped automatically, wrong types are rejected.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Some answers look invalid. Please refresh the page and try again.',
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    req.body = result.data;
    return next();
  };
}

module.exports = validate;
