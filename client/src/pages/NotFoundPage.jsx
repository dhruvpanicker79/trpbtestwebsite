import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo.js';

export default function NotFoundPage({ message = 'The page you’re looking for has left the pitch.' }) {
  useSeo({ title: 'Not found', noindex: true });
  return (
    <section className="container-site grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="font-display text-[8rem] font-bold leading-none text-blood sm:text-[12rem]">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Offside.</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-300">{message}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="btn-red">Front page</Link>
          <Link to="/search" className="btn-ghost">Search</Link>
        </div>
      </div>
    </section>
  );
}
