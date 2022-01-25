const Button = ({ text }) => {
  return (
    <button
      className="block border rounded-md bg-blue-500 text-white py-2 px-4 my-4"
      onClick={(event) => (event.target.innerText = "You clicked me!")}
    >
      {text}
    </button>
  );
};
export default Button;
