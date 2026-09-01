"use client";

import { useEffect, useRef } from "react";
import bodyHTML from "./_bodyContent";
import bodyScript from "./_bodyScript";

export default function ProductClient({ slug }) {
  const scriptRanRef = useRef(false);

  useEffect(() => {
    if (scriptRanRef.current) return;
    scriptRanRef.current = true;

    // Expose the slug from the dynamic route segment so the (verbatim) demo
    // script can pick the right product without relying on a ?p= query param.
    window.__PRODUCT_SLUG__ = slug;

    const script = document.createElement("script");
    script.text = bodyScript;
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));

    return () => {
      script.remove();
    };
  }, [slug]);

  return <div dangerouslySetInnerHTML={{ __html: bodyHTML }} />;
}
