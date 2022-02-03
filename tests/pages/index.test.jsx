import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '../../pages/index'

describe('Home', () => {

  // it('renders a heading', () => {
  //   render(<Home posts={[]}  selectedposts={[]} />)

  //   // const heading = screen.getByRole('heading', {
  //   //   name: /welcome to next\.js!/i,
  //   // })

  //   // expect(heading).toBeInTheDocument()
  //   const main = screen.getByRole("link");
  //   expect(main).toBeInTheDocument();
  // }),
  it("should render the heading", () => {
    const textToFind = "First Name"

    render(<Home posts={[]} />)
    const heading = screen.getByText(textToFind);

    expect(heading).toBeInTheDocument();
  });
})