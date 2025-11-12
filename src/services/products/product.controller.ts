
/**************ADMIN PRODUCT CONTROLLERS**********************/
//@route POST /api/v1/dashboard/admin/products/upload
//@desc Admin upload product thumbnail or email
//@access Private (Admin only)

//@route POST /api/v1/dashboard/admin/products
//@desc Admin adds a new product item (initial POST request)
//@access Private (Admin only)

//@route GET /api/v1/dashboard/admin/products
//@desc Fetch all products, optionally sort and filter by category
//@access Private (Admin only)

//@route GET /api/v1/dashboard/admin/products/:id
//@desc Fetch a product item
//@access Private (Admin only)

//@route PATCH /api/v1/dashboard/admin/products/:id
//@desc Admin edit product item
//@access Private (Admin only)

//@route DELETE /api/v1/dashboard/admin/products/:id
//@desc Delete product item
//@access Private (Admin only)


/**************CUSTOMER PRODUCT CONTROLLERS**********************/
//@route GET /api/v1/dashboard/admin/products
//@desc Fetch all products, optionally sort and filter by category
//@access Public (Customer)

//@route GET /api/v1/dashboard/admin/products/:id
//@desc Fetch a product item
//@access Public (Customer)