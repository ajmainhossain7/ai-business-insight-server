import { Router } from 'express';
import {
  uploadDataset,
  getDatasets,
  getDataset,
  deleteDataset,
} from '../controllers/dataset.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle, handleMulterError } from '../middleware/upload.middleware';

const router = Router();

// All dataset routes require authentication
router.use(authenticate);

// POST /api/datasets/upload — Upload a CSV file
router.post('/upload', uploadSingle, handleMulterError as any, uploadDataset);

// GET /api/datasets — List all datasets
router.get('/', getDatasets);

// GET /api/datasets/:id — Get a single dataset
router.get('/:id', getDataset);

// DELETE /api/datasets/:id — Delete a dataset
router.delete('/:id', deleteDataset);

export default router;
