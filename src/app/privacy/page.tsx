import type { Metadata } from "next";
import PrivacyPolicy from "../privacy-policy/page";

export const metadata: Metadata = {
  title: "Privacy Statement & Zero-Upload Guarantee",
  description: "Learn how Localtools executes all tool operations purely client-side with zero data retention.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default PrivacyPolicy;
