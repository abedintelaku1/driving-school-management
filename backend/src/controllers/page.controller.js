const Page = require('../models/Page');

const list = async (_req, res, next) => {
    try {
        const pages = await Page.find().sort({ updatedAt: -1 });
        res.json(pages);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const page = await Page.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }
        res.json(page);
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { title, slug, content, status } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const slugValue = (slug || title).toString().toLowerCase().trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        if (!slugValue) {
            return res.status(400).json({ message: 'Slug could not be generated from title' });
        }

        const existing = await Page.findOne({ slug: slugValue });
        if (existing) {
            return res.status(400).json({ message: 'A page with this slug already exists' });
        }

        const page = await Page.create({
            title: title.trim(),
            slug: slugValue,
            content: content ? content.trim() : '',
            status: status || 'draft',
            createdBy: req.user._id,
            updatedBy: req.user._id
        });

        res.status(201).json(page);
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { title, slug, content, status } = req.body;

        const page = await Page.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }

        if (title !== undefined) page.title = title.trim();
        if (slug !== undefined) {
            const slugValue = slug.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            if (slugValue) {
                const existing = await Page.findOne({ slug: slugValue, _id: { $ne: page._id } });
                if (existing) {
                    return res.status(400).json({ message: 'A page with this slug already exists' });
                }
                page.slug = slugValue;
            }
        }
        if (content !== undefined) page.content = content.trim();
        if (status !== undefined) page.status = status;
        page.updatedBy = req.user._id;
        page.updatedAt = new Date();

        await page.save();
        res.json(page);
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const page = await Page.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }
        await Page.findByIdAndDelete(req.params.id);
        res.json({ message: 'Page deleted successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    list,
    getById,
    create,
    update,
    remove
};
