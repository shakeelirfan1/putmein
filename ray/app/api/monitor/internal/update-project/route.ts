import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { findDomainConflict, getPrimaryProjectUrl } from "@/lib/domains";

/**
 * PATCH /api/monitor/internal/update-project
 *
 * Internal Brain → Ray endpoint for updating a monitored project's status, lastChecked,
 * or projectUrl / domains.
 * Requires X-Brain-Secret header matching BRAIN_INTERNAL_SECRET env var.
 */
export async function PATCH(req: NextRequest) {
  try {
    const secret = req.headers.get("x-brain-secret");
    const expected = process.env.BRAIN_INTERNAL_SECRET;
    if (secret !== expected) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, status, lastChecked, projectUrl } = body as {
      id?: string;
      name?: string;
      status?: string;
      lastChecked?: string;
      projectUrl?: string;
    };

    if (!id && !name) {
      return NextResponse.json({ error: "id or name is required" }, { status: 400 });
    }

    // Locate project
    const project = await prisma.rayMonitorProject.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(name ? [{ name: name.trim() }, { name: name.trim().toLowerCase() }] : []),
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
    }
    if (lastChecked) {
      updateData.lastChecked = new Date(lastChecked);
    }

    if (projectUrl !== undefined) {
      const cleanUrl = projectUrl ? projectUrl.trim() : null;
      if (cleanUrl) {
        const otherProjects = await prisma.rayMonitorProject.findMany({
          where: {
            id: { not: project.id },
          },
          select: { id: true, name: true, projectUrl: true },
        });

        const conflict = findDomainConflict(cleanUrl, project.id, otherProjects);
        if (conflict.hasConflict) {
          return NextResponse.json(
            { error: `Domain "${conflict.domain}" is already assigned to project "${conflict.projectName}".` },
            { status: 409 }
          );
        }
      }

      updateData.projectUrl = cleanUrl;

      // Sync deployment deployUrl
      const primaryUrl = getPrimaryProjectUrl(cleanUrl);
      await prisma.rayDeployment.updateMany({
        where: {
          OR: [
            { projectId: project.id },
            { name: project.name },
            { name: project.name.toLowerCase() },
          ],
        },
        data: {
          deployUrl: primaryUrl,
        },
      }).catch(() => {});
    }

    const updated = await prisma.rayMonitorProject.update({
      where: { id: project.id },
      data: updateData,
    });

    return NextResponse.json({ project: updated });
  } catch (err) {
    console.error("PATCH /api/monitor/internal/update-project:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
