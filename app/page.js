import ChatApp from '../components/ChatApp';

export default function Home() {
  // We apply the background color and min-height here to ensure the component is centered nicely.
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      {/* Renders the main ChatApp component */}
      <ChatApp />
    </main>
  );
}
