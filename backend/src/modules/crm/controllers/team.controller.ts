import { Request, Response } from 'express';
import * as teamService from '../services/team.service';

export async function getTeams(req: Request, res: Response) {
    try {
        const teams = await teamService.getTeams();
        res.json({ success: true, data: teams });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function getTeamById(req: Request, res: Response) {
    try {
        const team = await teamService.getTeamById(req.params.id);

        if (!team) {
            return res.status(404).json({ success: false, error: { message: 'Team not found' } });
        }

        res.json({ success: true, data: team });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function createTeam(req: Request, res: Response) {
    try {
        const team = await teamService.createTeam(req.body);
        res.status(201).json({ success: true, data: team });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function updateTeam(req: Request, res: Response) {
    try {
        const team = await teamService.updateTeam(req.params.id, req.body);
        res.json({ success: true, data: team });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function deleteTeam(req: Request, res: Response) {
    try {
        await teamService.deleteTeam(req.params.id);
        res.json({ success: true, data: { message: 'Team deleted successfully' } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}
