"use client";

import { useEffect, useRef } from "react";
import bodyHTML from "./_bodyContent";
import bodyScript from "./_bodyScript";

export default function Home() {
  const scriptRanRef = useRef(false);

  useEffect(() => {
    if (scriptRanRef.current) return;
    scriptRanRef.current = true;

    // The original script is wrapped in a DOMContentLoaded listener.
    // By the time this component mounts, that event has already fired,
    // so we dispatch it again on `document` for a script tag we control.
    const script = document.createElement("script");
    script.text = bodyScript;
    document.body.appendChild(script);
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));

    return () => {
      script.remove();
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: bodyHTML }} />;
}
