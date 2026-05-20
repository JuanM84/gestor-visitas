import { Router } from 'express';
import { InstitucionController } from '../controllers/institucion.controller';
import { verificarToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', verificarToken, InstitucionController.getInstituciones);
router.post('/', verificarToken, InstitucionController.createInstitucion);

export default router;
