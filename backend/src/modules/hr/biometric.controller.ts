import { Request, Response } from 'express';
import biometricService from './biometric.service';

/**
 * Controller for Biometric Device Management
 */
export async function getDevices(req: Request, res: Response) {
    try {
        const devices = await biometricService.getDevices();
        res.json(devices);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createDevice(req: Request, res: Response) {
    try {
        const device = await biometricService.createDevice(req.body);
        res.json(device);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateDevice(req: Request, res: Response) {
    try {
        const device = await biometricService.updateDevice(req.params.id, req.body);
        res.json(device);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function deleteDevice(req: Request, res: Response) {
    try {
        await biometricService.deleteDevice(req.params.id);
        res.json({ message: 'Device deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function testConnection(req: Request, res: Response) {
    try {
        const result = await biometricService.testConnection(req.params.id);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function syncAttendance(req: Request, res: Response) {
    try {
        const result = await biometricService.syncAttendance(req.params.id);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function discoverDevices(req: Request, res: Response) {
    try {
        const result = await biometricService.discoverDevices();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function syncEmployees(req: Request, res: Response) {
    try {
        const result = await biometricService.syncEmployees(req.params.id);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function syncAllDevices(req: Request, res: Response) {
    try {
        const result = await biometricService.syncAllDevices();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
