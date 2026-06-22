export const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

export const paginateResult = async (model, filter = {}, page = 1, limit = 10, sort = { createdAt: -1 }) => {
  const total = await model.countDocuments(filter);
  const items = await model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit);
  return {
    items,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  };
};
