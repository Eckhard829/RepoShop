import { EMAIL } from '../api';

export default function Contact() {
  return (
    <>
      <h1>Contact</h1>
      <div className="card narrow">
        <p>Questions or problems with your account?</p>
        <a className="btn primary" href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </div>
    </>
  );
}