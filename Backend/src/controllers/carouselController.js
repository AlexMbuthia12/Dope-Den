const CarouselSlide = require('../models/CarouselSlide');
const { resolveMediaPayload } = require('../utils/mediaStorage');

exports.getCarouselSlides = async (req, res, next) => {
  try {
    const slides = await CarouselSlide.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json(slides);
  } catch (error) {
    next(error);
  }
};

exports.createCarouselSlide = async (req, res, next) => {
  try {
    const { title, subtitle, cta, type, src, fileName } = req.body;

    if (!src) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Media source is required.',
      });
    }

    const mediaPayload = resolveMediaPayload({
      src,
      fileName,
      mediaType: type || 'image',
    });

    const slide = await CarouselSlide.create({
      title: title || 'Featured drop',
      subtitle: subtitle || 'Fresh arrivals for the season.',
      cta: cta || 'Shop now',
      type: (type === 'video' ? 'video' : 'image'),
      src: mediaPayload.mediaUrl,
      storageProvider: mediaPayload.storageProvider,
      isActive: true,
    });

    res.status(201).json({
      statusCode: 201,
      message: 'Carousel slide created successfully',
      slide,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCarouselSlide = async (req, res, next) => {
  try {
    const slide = await CarouselSlide.findByIdAndDelete(req.params.id);

    if (!slide) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Carousel slide not found',
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: 'Carousel slide deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
