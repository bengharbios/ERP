import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all teams
 */
export async function getTeams() {
    const teams = await prisma.crmTeam.findMany({
        where: { active: true },
        include: {
            leader: {
                select: {
                    id: true,
                    username: true
                }
            },
            members: {
                select: {
                    id: true,
                    username: true
                }
            },
            _count: {
                select: {
                    leads: true
                }
            }
        },
        orderBy: { sequence: 'asc' }
    });

    // Calculate statistics for each team
    const enrichedTeams = await Promise.all(
        teams.map(async (team) => {
            // Get all leads for this team
            const allLeads = await prisma.crmLead.findMany({
                where: { teamId: team.id, active: true }
            });

            // Get opportunities
            const opportunities = allLeads.filter(l => l.type === 'opportunity');

            // Get won opportunities
            const wonLeads = await prisma.crmLead.findMany({
                where: {
                    teamId: team.id,
                    active: true,
                    stage: {
                        isWon: true
                    }
                }
            });

            // Calculate revenue
            const totalRevenue = wonLeads.reduce((sum, lead) =>
                sum + Number(lead.expectedRevenue || 0), 0
            );

            // Calculate conversion rate
            const conversionRate = opportunities.length > 0
                ? (wonLeads.length / opportunities.length) * 100
                : 0;

            return {
                ...team,
                metrics: {
                    leadsCount: allLeads.filter(l => l.type === 'lead').length,
                    opportunitiesCount: opportunities.length,
                    wonCount: wonLeads.length,
                    conversionRate: Math.round(conversionRate * 10) / 10,
                    totalRevenue,
                    membersCount: team.members.length
                }
            };
        })
    );

    return enrichedTeams;
}

/**
 * Get a single team by ID
 */
export async function getTeamById(id: string) {
    const team = await prisma.crmTeam.findUnique({
        where: { id },
        include: {
            leader: {
                select: {
                    id: true,
                    username: true
                }
            },
            members: {
                select: {
                    id: true,
                    username: true
                }
            },
            leads: {
                where: { active: true },
                include: {
                    stage: true,
                    salesperson: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            }
        }
    });

    if (!team) return null;

    // Calculate detailed statistics
    const opportunities = team.leads.filter(l => l.type === 'opportunity');
    const wonLeads = team.leads.filter(l => l.stage?.isWon);
    const totalRevenue = wonLeads.reduce((sum, lead) =>
        sum + Number(lead.expectedRevenue || 0), 0
    );
    const expectedRevenue = opportunities.reduce((sum, lead) =>
        sum + Number(lead.expectedRevenue || 0) * (lead.probability / 100), 0
    );

    return {
        ...team,
        metrics: {
            leadsCount: team.leads.filter(l => l.type === 'lead').length,
            opportunitiesCount: opportunities.length,
            wonCount: wonLeads.length,
            conversionRate: opportunities.length > 0
                ? Math.round((wonLeads.length / opportunities.length) * 100 * 10) / 10
                : 0,
            totalRevenue,
            expectedRevenue,
            membersCount: team.members.length
        }
    };
}

/**
 * Create a new team
 */
export async function createTeam(data: any) {
    const { memberIds, ...teamData } = data;

    const team = await prisma.crmTeam.create({
        data: {
            ...teamData,
            members: memberIds ? {
                connect: memberIds.map((id: string) => ({ id }))
            } : undefined
        },
        include: {
            leader: {
                select: {
                    id: true,
                    username: true
                }
            },
            members: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });

    return team;
}

/**
 * Update a team
 */
export async function updateTeam(id: string, data: any) {
    const { memberIds, ...teamData } = data;

    const updateData: any = { ...teamData };

    if (memberIds !== undefined) {
        updateData.members = {
            set: memberIds.map((memberId: string) => ({ id: memberId }))
        };
    }

    const team = await prisma.crmTeam.update({
        where: { id },
        data: updateData,
        include: {
            leader: {
                select: {
                    id: true,
                    username: true
                }
            },
            members: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });

    return team;
}

/**
 * Delete a team (soft delete)
 */
export async function deleteTeam(id: string) {
    await prisma.crmTeam.update({
        where: { id },
        data: { active: false }
    });

    return { success: true };
}
