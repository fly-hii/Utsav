import { Request, Response } from 'express';
import { committeeService } from './committee.service';
import { sendSuccess, sendCreated, sendError } from '../../utils/response';

export class CommitteeController {
  /**
   * POST /api/committees/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const files: any = {};
      if (req.files) {
        const uploadedFiles = req.files as { [fieldname: string]: Express.Multer.File[] };
        files.logo = uploadedFiles['logo']?.[0];
        files.templeImages = uploadedFiles['templeImages'];
        files.registrationCert = uploadedFiles['registrationCert']?.[0];
        files.identityProof = uploadedFiles['identityProof']?.[0];
      }

      // Parse and normalize fields for database insertion
      const lat = parseFloat(req.body.latitude);
      const lng = parseFloat(req.body.longitude);

      const body = {
        name: req.body.name || 'Unnamed Committee',
        templeName: req.body.templeName || 'Temple',
        festivalName: req.body.festivalName || `${req.body.templeName || 'Temple'} Utsavam`,
        village: req.body.village || 'Village',
        mandal: req.body.mandal || req.body.village || 'Mandal',
        district: req.body.district || 'District',
        state: req.body.state || 'Andhra Pradesh',
        address: req.body.address || `${req.body.village || 'Village'}, ${req.body.district || 'District'}`,
        latitude: isNaN(lat) ? 16.98 : lat,
        longitude: isNaN(lng) ? 81.72 : lng,
        presidentName: req.body.presidentName || 'President',
        secretaryName: req.body.secretaryName || 'Secretary',
        phone: req.body.phone,
        password: req.body.password || 'password123',
        email: req.body.email || null,
        description: req.body.description || null,
      };

      const result = await committeeService.registerCommittee(body as any, files);
      sendCreated(res, result, 'Committee registration submitted. Pending admin approval.');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/committees
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const result = await committeeService.getCommittees(req.query as any);
      sendSuccess(res, result.committees, 'Committees fetched', 200, result.meta);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/committees/nearby
   */
  async nearby(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, radius, page, limit } = req.query as any;
      const result = await committeeService.getNearbyCommittees(
        parseFloat(latitude),
        parseFloat(longitude),
        radius ? parseFloat(radius) : 25,
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 20
      );
      sendSuccess(res, result.committees, 'Nearby committees fetched', 200, result.meta);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/committees/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const committee = await committeeService.getCommitteeById(req.params.id);
      sendSuccess(res, committee);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/committees/:id/profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const profile = await committeeService.getCommitteeProfile(req.params.id);
      sendSuccess(res, profile);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * PUT /api/committees/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const committee = await committeeService.updateCommittee(
        req.params.id,
        req.user!.userId,
        req.body
      );
      sendSuccess(res, committee, 'Committee updated');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * PUT /api/committees/:id/qrcode
   */
  async uploadQRCode(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        throw { statusCode: 400, message: 'QR Code image is required' };
      }
      const committee = await committeeService.uploadQRCode(
        req.params.id,
        req.user!.userId,
        req.file
      );
      sendSuccess(res, committee, 'QR Code updated successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/committees/:id/dashboard
   */
  async dashboard(req: Request, res: Response): Promise<void> {
    try {
      const stats = await committeeService.getDashboard(req.params.id);
      sendSuccess(res, stats);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
}

export const committeeController = new CommitteeController();
