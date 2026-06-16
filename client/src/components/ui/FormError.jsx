export default function FormError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-right">
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}
