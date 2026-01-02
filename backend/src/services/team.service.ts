import { prisma } from "../server.js";
import { CreateTeam, AddTeamMembers } from "../utils/validators.js";

export class TeamService {
  static async list(eventId: string, clubId?: string) {
    const where: any = { eventId };
    if (clubId) where.clubId = clubId;

    return prisma.team.findMany({
      where, 
      include: { members: { include: { athlete: true } }, division: true, club: true },
      orderBy: { createdAt: "desc" }
    });
  }

  static async create(data: unknown) {
    const parsed = CreateTeam.parse(data);
    return prisma.team.create({ data: parsed });
  }

  static async addMembers(data: unknown) {
    const { teamId, members } = AddTeamMembers.parse(data);
    // Note: Calling logic must check ownership before calling this, or we can check here if we fetch the team.
    // For efficiency, assuming caller checked or we re-fetch.
    
    // Check team existence to be safe
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw { status: 404, message: "Team not found" };

    // We can return the team object here so the controller can verify ownership if it hasn't already.
    // Or better, let's keep it simple: we just add members.
    
    await prisma.teamMember.createMany({ 
      data: members.map(m => ({ teamId, ...m })) 
    });
    
    return prisma.team.findUnique({ 
      where: { id: teamId }, 
      include: { members: true } 
    });
  }
  
  static async getById(id: string) {
      return prisma.team.findUnique({ where: { id } });
  }
}
