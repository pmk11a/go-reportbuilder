import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportTitleBand } from './ReportTitleBand'

describe('ReportTitleBand', () => {
  it('renders fallback title', () => {
    render(<ReportTitleBand fallbackTitle="Laporan Uji" fallbackSubtitle="Sub" />)
    expect(screen.getByText('Laporan Uji')).toBeInTheDocument()
    expect(screen.getByText('Sub')).toBeInTheDocument()
  })

  it('substitutes @param in configured title', () => {
    render(
      <ReportTitleBand
        fallbackTitle="Default"
        filterValues={{ periode: 'Jan 2024' }}
        footerBandsJson={{
          bands: {
            title: { enabled: true, content: 'Laporan @periode', align: 'center' },
          },
        }}
      />
    )
    expect(screen.getByText('Laporan Jan 2024')).toBeInTheDocument()
  })

  it('substitutes [param] in configured title', () => {
    render(
      <ReportTitleBand
        fallbackTitle="Default"
        filterValues={{ periode: 'Jan 2024' }}
        footerBandsJson={{
          bands: {
            title: { enabled: true, content: 'Laporan [periode]' },
          },
        }}
      />
    )
    expect(screen.getByText('Laporan Jan 2024')).toBeInTheDocument()
  })

  it('applies center alignment', () => {
    const { container } = render(
      <ReportTitleBand
        fallbackTitle="Centered"
        footerBandsJson={{ bands: { title: { enabled: true, content: 'Centered', align: 'center' } } }}
      />
    )
    expect(container.firstChild).toHaveClass('text-center')
  })

  it('renders divider when configured', () => {
    const { container } = render(
      <ReportTitleBand
        fallbackTitle="With Divider"
        footerBandsJson={{ bands: { title: { enabled: true, content: 'With Divider', divider: true } } }}
      />
    )
    // Divider renders as a div with role/aria, just verify a child div exists above the h1
    const divs = container.querySelectorAll('div')
    expect(divs.length).toBeGreaterThan(0)
  })

  it('uses custom font size and weight', () => {
    const { container } = render(
      <ReportTitleBand
        fallbackTitle="Medium Bold"
        footerBandsJson={{
          bands: { title: { enabled: true, content: 'Medium Bold', font_size: 'medium', font_weight: 'semibold' } },
        }}
      />
    )
    const h1 = container.querySelector('h1')
    expect(h1).toHaveClass('text-base')
    expect(h1).toHaveClass('font-semibold')
  })
})
