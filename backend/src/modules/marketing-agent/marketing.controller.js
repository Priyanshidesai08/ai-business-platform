import { ApiError } from '../../utils/apiError.js';
import {
  generateAdCopy,
  generateCampaign,
  generateEmail,
  generatePost,
  listCampaigns,
  updateCampaignContent
} from './marketing.service.js';

export const post = async (req, res, next) => {
  try {
    res.status(200).json(await generatePost(req.user.id, req.body));
  } catch (error) {
    next(error);
  }
};

export const email = async (req, res, next) => {
  try {
    res.status(200).json(await generateEmail(req.user.id, req.body));
  } catch (error) {
    next(error);
  }
};

export const campaign = async (req, res, next) => {
  try {
    res.status(200).json(await generateCampaign(req.user.id, req.body));
  } catch (error) {
    next(error);
  }
};

export const adcopy = async (req, res, next) => {
  try {
    res.status(200).json(await generateAdCopy(req.user.id, req.body));
  } catch (error) {
    next(error);
  }
};

export const campaigns = async (req, res, next) => {
  try {
    res.status(200).json({ campaigns: await listCampaigns(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const regenerateCampaign = async (req, res, next) => {
  try {
    const campaign = await updateCampaignContent(req.user.id, req.params.id, req.body.content);
    if (!campaign) throw new ApiError(404, 'Campaign not found');
    res.status(200).json({ campaign });
  } catch (error) {
    next(error);
  }
};
