import { z } from "zod";
import { getConfig } from "@/lib/config";
import { demoMilestone } from "@/lib/demo";
import { HEX_ADDRESS, HEX_UID, type KarmaMilestone, type KarmaProjectSupport } from "@/lib/domain";
import { fetchJson } from "@/lib/http";

const attestationSchema = z.object({
  uid: z.string().regex(HEX_UID),
  revoked: z.boolean().default(false),
  data: z.object({ type: z.string() }).passthrough(),
  createdAt: z.unknown().optional()
}).passthrough();

const milestoneSchema = z.object({
  uid: z.string().regex(HEX_UID),
  refUID: z.string().regex(HEX_UID),
  recipient: z.string().regex(HEX_ADDRESS),
  revoked: z.boolean().default(false),
  data: z.object({
    title: z.string(),
    description: z.string().default(""),
    endsAt: z.coerce.number()
  }).passthrough(),
  approved: attestationSchema.optional(),
  completed: attestationSchema.optional(),
  rejected: attestationSchema.optional()
}).passthrough();

const grantSchema = z.object({
  uid: z.string().regex(HEX_UID),
  revoked: z.boolean().default(false),
  details: z.object({
    data: z.object({ payoutAddress: z.string().regex(HEX_ADDRESS).optional() }).passthrough()
  }).passthrough().optional(),
  milestones: z.array(milestoneSchema).default([]),
  project: z.object({
    details: z.object({ data: z.object({ slug: z.string().optional() }).passthrough() }).passthrough().optional()
  }).passthrough().optional()
}).passthrough();

const projectSupportSchema = z.object({
  uid: z.string().regex(HEX_UID),
  chainPayoutAddress: z.record(z.string(), z.string().regex(HEX_ADDRESS)),
  details: z.object({
    title: z.string().min(1),
    slug: z.string().min(2)
  }).passthrough()
}).passthrough();

export class KarmaClient {
  async getProjectSupport(projectSlug: string, chainId: number): Promise<KarmaProjectSupport> {
    const config = getConfig();
    const url = `${config.KARMA_API_BASE_URL.replace(/\/$/, "")}/v2/projects/${encodeURIComponent(projectSlug)}`;
    const project = projectSupportSchema.parse(await fetchJson<unknown>(url, {}, 12_000));
    if (project.details.slug !== projectSlug) throw new Error("Karma project slug does not match the requested project");
    const recipient = project.chainPayoutAddress[String(chainId)];
    if (!recipient) throw new Error(`Karma project has not enabled donations on chain ${chainId}`);
    return {
      uid: project.uid,
      slug: project.details.slug,
      title: project.details.title,
      chainId,
      recipient,
      evidenceUrl: `https://www.karmahq.xyz/project/${encodeURIComponent(projectSlug)}`
    };
  }

  async getMilestone(projectSlug: string, grantUID: string, milestoneUID: string): Promise<KarmaMilestone> {
    const config = getConfig();
    if (config.demo) return demoMilestone();

    const url = `${config.KARMA_API_BASE_URL.replace(/\/$/, "")}/grants/${encodeURIComponent(grantUID)}`;
    const payload = await fetchJson<unknown>(url, {}, 12_000);
    const grant = grantSchema.parse(payload);
    if (grant.revoked) throw new Error("Karma grant has been revoked");
    const milestone = grant.milestones.find((entry) => entry.uid.toLowerCase() === milestoneUID.toLowerCase());
    if (!milestone) throw new Error("Milestone does not belong to the specified Karma grant");

    const actualSlug = grant.project?.details?.data.slug;
    if (actualSlug && actualSlug !== projectSlug) throw new Error("Karma project slug does not match the grant");
    const status = milestone.rejected && !milestone.rejected.revoked
      ? "rejected"
      : milestone.approved && !milestone.approved.revoked
        ? "approved"
        : milestone.completed && !milestone.completed.revoked
          ? "completed"
          : "pending";

    return {
      uid: milestone.uid,
      grantUID: grant.uid,
      projectSlug,
      title: milestone.data.title,
      description: milestone.data.description,
      endsAt: milestone.data.endsAt,
      recipient: grant.details?.data.payoutAddress ?? milestone.recipient,
      revoked: milestone.revoked,
      status,
      approvalAttestationUID: milestone.approved?.uid,
      approvalRevoked: milestone.approved?.revoked ?? false,
      evidenceUrl: `https://www.karmahq.xyz/project/${encodeURIComponent(projectSlug)}`
    };
  }

  async verifyApproved(expected: Pick<KarmaMilestone, "projectSlug" | "grantUID" | "uid" | "recipient">): Promise<KarmaMilestone> {
    const current = await this.getMilestone(expected.projectSlug, expected.grantUID, expected.uid);
    const problems: string[] = [];
    if (current.revoked) problems.push("milestone is revoked");
    if (current.status !== "approved") problems.push(`milestone status is ${current.status}`);
    if (!current.approvalAttestationUID) problems.push("approval attestation is missing");
    if (current.approvalRevoked) problems.push("approval attestation is revoked");
    if (current.recipient.toLowerCase() !== expected.recipient.toLowerCase()) problems.push("recipient changed in Karma");
    if (problems.length) throw new Error(`Karma verification failed: ${problems.join(", ")}`);
    return current;
  }
}
