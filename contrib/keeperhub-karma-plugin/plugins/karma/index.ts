import type { ActionConfigField, IntegrationPlugin } from "@/plugins/registry";
import { registerIntegration } from "@/plugins/registry-core";
import { KarmaIcon } from "./icon";

const uidField = (key: string, label: string): ActionConfigField => ({ key, label, type: "template-input", placeholder: "0x... or {{NodeName.uid}}", required: true });

const karmaPlugin: IntegrationPlugin = {
  type: "karma",
  egress: "fixed-destination",
  label: "Karma GAP",
  description: "Read and verify grant accountability data from Karma GAP",
  icon: KarmaIcon,
  requiresCredentials: false,
  formFields: [],
  actions: [
    {
      slug: "get-project", label: "Get Project", description: "Fetch a Karma project by UID or slug", category: "Karma GAP",
      stepFunction: "getProjectStep", stepImportPath: "get-project",
      outputFields: [{ field: "success", description: "Whether the lookup succeeded" }, { field: "project", description: "Canonical Karma project" }, { field: "error", description: "Failure reason" }],
      configFields: [{ key: "projectId", label: "Project UID or slug", type: "template-input", placeholder: "project-slug", required: true }]
    },
    {
      slug: "get-grant", label: "Get Grant", description: "Fetch a Karma grant and its milestones", category: "Karma GAP",
      stepFunction: "getGrantStep", stepImportPath: "get-grant",
      outputFields: [{ field: "success", description: "Whether the lookup succeeded" }, { field: "grant", description: "Canonical Karma grant" }, { field: "error", description: "Failure reason" }], configFields: [uidField("grantUID", "Grant UID")]
    },
    {
      slug: "get-milestone", label: "Get Milestone", description: "Resolve one milestone inside its grant", category: "Karma GAP",
      stepFunction: "getMilestoneStep", stepImportPath: "get-milestone",
      outputFields: [{ field: "success", description: "Whether the lookup succeeded" }, { field: "milestone", description: "Milestone with approval state" }, { field: "error", description: "Failure reason" }], configFields: [uidField("grantUID", "Grant UID"), uidField("milestoneUID", "Milestone UID")]
    },
    {
      slug: "verify-milestone-approval", label: "Verify Milestone Approval", description: "Fail closed unless a milestone has a live, non-revoked approval", category: "Karma GAP",
      stepFunction: "verifyMilestoneApprovalStep", stepImportPath: "verify-milestone-approval",
      outputFields: [{ field: "success", description: "Whether verification succeeded" }, { field: "approved", description: "True only for a live approval" }, { field: "approvalUID", description: "Approval attestation UID" }, { field: "recipient", description: "Grant payout address" }, { field: "error", description: "Failure reason" }], configFields: [uidField("grantUID", "Grant UID"), uidField("milestoneUID", "Milestone UID")]
    }
  ]
};

registerIntegration(karmaPlugin);
export default karmaPlugin;
