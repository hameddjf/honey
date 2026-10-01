"use client";

import { useEffect, useRef, useState } from "react";
import buildBodyHTML from "./_bodyContent";
import bodyScript from "./_bodyScript";
import { fetchSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/siteContent";

export default function ContactClient() {
  const scriptRanRef = useRef(false);
  const [html, setHtml] = useState(() => buildBodyHTML(DEFAULT_SITE_CONTENT));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSiteContent()
      .catch(() => DEFAULT_SITE_CONTENT)
      .then((content) => {
        if (cancelled) return;
        setHtml(buildBodyHTML(content));
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || scriptRanRef.current) return;
    scriptRanRef.current = true;
    const script = document.createElement("script");
    script.text = bodyScript;
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
  }, [ready]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
