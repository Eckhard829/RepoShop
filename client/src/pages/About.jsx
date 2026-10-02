import ScrollReveal from '../components/ScrollReveal';

export default function About() {
  return (
    <>
      <h1>About us</h1>
      <ScrollReveal baseOpacity={0.1} enableBlur baseRotation={2} blurStrength={4}>
        Replace this with your story: who you are, what the repository contains and who it is for.
      </ScrollReveal>
      <ScrollReveal baseOpacity={0.1} enableBlur baseRotation={2} blurStrength={4}>
        We sell the repository directly so you get the full code, with no middlemen and no subscriptions.
      </ScrollReveal>
    </>
  );
}