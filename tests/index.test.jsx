import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '../pages/index'

describe('Home', () => {
  it('renders a heading', () => {
    render(<Home posts={[]} />)

    // const heading = screen.getByRole('heading', {
    //   name: /welcome to next\.js!/i,
    // })

    // expect(heading).toBeInTheDocument()
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  })
})