import type { Metadata } from "next";
import Realm from "@/components/underworld/realm";
import { UNDERWORLD } from "@/lib/content";

export const metadata: Metadata = {
  title: UNDERWORLD.metaTitle,
  description: UNDERWORLD.metaDescription,
  robots: { index: false }, // a secret, not a landing page
};

export default function Page() {
  return <Realm />;
}
