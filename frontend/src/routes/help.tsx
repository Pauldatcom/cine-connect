import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/help')({
  component: HelpPage,
});

const FAQ: { question: string; answer: string }[] = [
  {
    question: 'How do I create an account?',
    answer:
      'Click on "Sign In" in the top-right corner, then choose "Create Account". You can register with your email or sign in directly with your Google account.',
  },
  {
    question: 'How do I add a film to my watchlist?',
    answer:
      'Go to any film page and click the bookmark icon or the "Add to Watchlist" button. You can view and manage your watchlist from your profile page.',
  },
  {
    question: 'How do I write a review?',
    answer:
      'Open a film page, scroll down to the reviews section, and click "Write a review". You can give a rating out of 10 and add a written comment.',
  },
  {
    question: 'How do I add friends?',
    answer:
      'Go to the Members page to search for other users. Visit their profile and send a friend request. They will need to accept it before you are connected.',
  },
  {
    question: 'Where does the film data come from?',
    answer:
      'CinéConnect uses data from the OMDB API and The Movie Database (TMDb) to provide film information, posters, cast, and crew details.',
  },
  {
    question: 'Can I use CinéConnect on mobile?',
    answer:
      'Yes! CinéConnect is fully responsive and works on any modern browser on smartphones, tablets, and desktops.',
  },
  {
    question: 'How do I change my password or email?',
    answer:
      'Go to your profile, then click the "Settings" button. From there you can update your username, email, and password.',
  },
  {
    question: 'I signed in with Google — can I set a password?',
    answer:
      'Google accounts use OAuth and do not require a password for CinéConnect. Your account is secured through Google directly.',
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-border border-b last:border-0">
      <button
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-text-primary font-medium">{question}</span>
        {open ? (
          <ChevronUp className="text-text-tertiary h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="text-text-tertiary h-4 w-4 shrink-0" />
        )}
      </button>
      {open && <p className="text-text-secondary pb-4 text-sm leading-relaxed">{answer}</p>}
    </div>
  );
}

export function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-display text-text-primary text-4xl font-bold">Help Center</h1>
        <p className="text-text-secondary mt-3">
          Everything you need to know about using CinéConnect.
        </p>
      </div>

      <section className="card mb-8">
        <h2 className="text-text-primary mb-2 text-xl font-bold">Frequently Asked Questions</h2>
        <p className="text-text-secondary mb-6 text-sm">
          Can't find the answer you're looking for?{' '}
          <Link to="/contact" className="text-letterboxd-green hover:underline">
            Contact us
          </Link>
          .
        </p>
        <div>
          {FAQ.map((item) => (
            <FaqItem key={item.question} {...item} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-text-primary mb-3 text-xl font-bold">Still need help?</h2>
        <p className="text-text-secondary mb-4 text-sm">
          Our team is small but responsive. Send us a message and we'll get back to you as soon as
          possible.
        </p>
        <Link to="/contact" className="btn-primary inline-block">
          Contact us
        </Link>
      </section>
    </div>
  );
}
