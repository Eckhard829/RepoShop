import { Link } from 'react-router-dom';
import TextType from '../components/TextType';
import ScrollReveal from '../components/ScrollReveal';
import { PRICE } from '../api';

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>
          <TextType as="span" text={['Buy the repository.', 'Own it for good.', 'Download it once.']}
            typingSpeed={70} deletingSpeed={40} pauseDuration={1500} cursorCharacter="_" />
        </h1>
        <p>Pay once, get your own private copy of the full source code, delivered straight to your dashboard.</p>
        <Link className="btn primary" to="/signup">Get started</Link> <Link className="btn" to="/about">Learn more</Link>
      </section>

      <ScrollReveal baseOpacity={0.1} enableBlur baseRotation={3} blurStrength={4}>
        One payment. The full source code. No subscriptions, no middlemen, just one private download link made for you.
      </ScrollReveal>

      <div className="grid">
        <div className="card"><span className="num">1</span><h3>Create an account</h3><p>Sign up with your email in under a minute.</p></div>
        <div className="card"><span className="num">2</span><h3>Pay securely</h3><p>Checkout is handled by Yoco. We never see your card details.</p></div>
        <div className="card"><span className="num">3</span><h3>Download</h3><p>A private one-time link appears in your dashboard once payment is confirmed.</p></div>
      </div>

      <div className="card center narrow">
        <h2>Full repository</h2>
        <div className="price">{PRICE}</div>
        <p>One payment, full source code.</p>
        <Link className="btn primary" to="/signup">Sign up to buy</Link>
      </div>
    </>
  );
}