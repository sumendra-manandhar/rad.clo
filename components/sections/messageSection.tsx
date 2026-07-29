import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger, SplitText } from "gsap/all";

// Register ScrollTrigger so GSAP recognizes the scrollTrigger configuration object
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function MessageSection() {
  useGSAP(() => {
    // 1. Instantiating premium SplitText instances
    const firstMsgSplit = SplitText.create(".first-message", {
      type: "words",
    });

    const secMsgSplit = SplitText.create(".second-message", {
      type: "words",
    });

    const paragraphSplit = SplitText.create(".message-content p", {
      type: "words, lines",
      linesClass: "paragraph-line",
    });

    // 2. First message text fill animation
    gsap.to(firstMsgSplit.words, {
      color: "#faeade",
      ease: "power1.in",
      stagger: 1,
      scrollTrigger: {
        trigger: ".message-content",
        start: "top center",
        end: "30% center",
        scrub: true,
      },
    });

    // 3. Second message text fill animation
    gsap.to(secMsgSplit.words, {
      color: "#faeade",
      ease: "power1.in",
      stagger: 1,
      scrollTrigger: {
        trigger: ".second-message",
        start: "top center",
        end: "bottom center",
        scrub: true,
      },
    });

    // 4. Clip-path scroll banner reveal timeline
    const revealTl = gsap.timeline({
      delay: 1,
      scrollTrigger: {
        trigger: ".msg-text-scroll",
        start: "top 60%",
      },
    });

    revealTl.to(".msg-text-scroll", {
      duration: 1,
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      ease: "circ.inOut",
    });

    // 5. Paragraph words lines-up split animation
    const paragraphTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".message-content p",
        start: "top center",
      },
    });

    paragraphTl.from(paragraphSplit.words, {
      yPercent: 300,
      rotate: 3,
      ease: "power1.inOut",
      duration: 1,
      stagger: 0.01,
    });

    // Cleanup split elements automatically when component unmounts
    return () => {
      firstMsgSplit.revert();
      secMsgSplit.revert();
      paragraphSplit.revert();
    };
  });

  return (
    <section className="message-content">
      <div className="container mx-auto flex-center py-28 relative">
        <div className="w-full h-full">
          <div className="msg-wrapper">
            <h1 className="first-message">STRAIGHT FROM THE ROOTS,</h1>

            <div
              style={{
                clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)",
              }}
              className="msg-text-scroll"
            >
              <div className="bg-light-brown md:pb-5 pb-3 px-5">
                <h2 className="text-red-brown">हजुरआमाको स्वाद</h2>
              </div>
            </div>

            <h1 className="second-message">IT’S BACK WITH A VENGEANCE.</h1>
          </div>

          <div className="flex-center md:mt-20 mt-10">
            <div className="max-w-md px-10 flex-center overflow-hidden">
              <p>
                Rev up your dead tastebuds and feed the true Gorkhali spirit
                with [Brand Name]. One lethal spoonful and you are straight back
                to हजुरआमाको हातको स्वाद with that tear-jerking, खतरनाक रसिलो र
                पिरो flavor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
