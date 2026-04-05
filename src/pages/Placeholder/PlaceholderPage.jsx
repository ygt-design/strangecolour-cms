import styled from "styled-components";
import { FONT_STACK, FW_LIGHT, FW_BOLD, G } from "../../theme/cmsTokens";
import { GRID } from "../../grid";

const Page = styled.main`
  padding: 0.75rem 0 3rem 0;
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
`;

const Heading = styled.h1`
  font-family: ${FONT_STACK};
  font-weight: ${FW_BOLD};
  font-style: normal;
  text-transform: uppercase;
  font-size: clamp(3rem, 3.5vw, 4rem);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
  max-width: 50%;
  line-height: 1.1;

  @media ${GRID.MEDIA_MOBILE} {
    max-width: 100%;
  }
`;

const Notice = styled.p`
  font-family: ${FONT_STACK};
  font-weight: ${FW_LIGHT};
  font-size: 0.92rem;
  color: ${G.text};
  line-height: 1.5;
  padding: 1.5rem 0;
  border-bottom: 1px solid ${G.line};
`;

export default function PlaceholderPage({ title = "Page" }) {
  return (
    <Page>
      <Heading>{title}</Heading>
      <Notice>
        Content editing for this page is coming soon.
      </Notice>
    </Page>
  );
}
