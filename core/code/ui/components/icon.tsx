import { Component } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import imgShare from "!!raw-loader!images/share.svg";
import imgEnergy0 from "!!raw-loader!images/portal/energy-icons/battery-0.svg";
import imgEnergy10 from "!!raw-loader!images/portal/energy-icons/battery-10.svg";
import imgEnergy20 from "!!raw-loader!images/portal/energy-icons/battery-20.svg";
import imgEnergy30 from "!!raw-loader!images/portal/energy-icons/battery-30.svg";
import imgEnergy40 from "!!raw-loader!images/portal/energy-icons/battery-40.svg";
import imgEnergy50 from "!!raw-loader!images/portal/energy-icons/battery-50.svg";
import imgEnergy60 from "!!raw-loader!images/portal/energy-icons/battery-60.svg";
import imgEnergy70 from "!!raw-loader!images/portal/energy-icons/battery-70.svg";
import imgEnergy80 from "!!raw-loader!images/portal/energy-icons/battery-80.svg";
import imgEnergy90 from "!!raw-loader!images/portal/energy-icons/battery-90.svg";
import imgEnergy100 from "!!raw-loader!images/portal/energy-icons/battery-100.svg";


type SVGString = string;
type SVGSVGElementTags = JSX.SVGElementTags["svg"];
export interface IconProps extends SVGSVGElementTags {
  size?: string | number;
  color?: string;
  title?: string;
  style?: JSX.CSSProperties;
}

export const IconTemplate: Component<{ iconSrc: SVGString, props?: IconProps }> = p => {
    const {data,attributes} = getSVGFromSource(p.iconSrc);

    const props:IconProps = p.props || {}

    // const mergedProps = mergeProps(iconSrc.a, props) as IconBaseProps;
    // const [_, svgProps] = splitProps(mergedProps, ["src"]);
    // stroke={iconSrc.a?.stroke}
    // {...svgProps}
  
    return (
      <svg
        color={props.color || "currentColor"}
        fill={props.color || "currentColor"}
        stroke-width="0"
        style={{
          ...props.style,
          overflow: "visible",
        }}
        height={props.size || "1em"}
        width={props.size || "1em"}
        xmlns="http://www.w3.org/2000/svg"
        innerHTML={data}
      />
    );
  }


function getSVGFromSource(src: SVGString): {data: string, attributes: NamedNodeMap } {
    const svgContainer = document.createElement('div');
    svgContainer.innerHTML = src;
    const element = svgContainer.firstElementChild;

    const data = svgContainer.firstElementChild.innerHTML;
    const attributes = element.attributes;
    
    return {data, attributes}
}

// Custom Icons
export const IconShare: Component<{ props?: IconProps }> = p => {
  return <IconTemplate iconSrc={imgShare} {...p.props} />
}

export const IconEnergy0: Component<{ props?: IconProps }> = p => { return <IconTemplate iconSrc={imgEnergy0} {...p.props} /> }
export const IconEnergy10: Component<{ props?: IconProps }> = p => { return <IconTemplate iconSrc={imgEnergy10} {...p.props} /> }
export const IconEnergy20: Component<{ props?: IconProps }> = p => { return <IconTemplate iconSrc={imgEnergy20} {...p.props} /> }
export const IconEnergy30: Component<{ props?: IconProps }> = p => { return <IconTemplate iconSrc={imgEnergy30} {...p.props} /> }
export const IconEnergy40: Component<{ props?: IconProps }> = p => { return <IconTemplate iconSrc={imgEnergy40} {...p.props} /> }
export const IconEnergy50: Component<{ props?: IconProps }> = p => { return <IconTemplate iconSrc={imgEnergy50} {...p.props} /> }
export const IconEnergy60: Component<{ props?: IconProps }> = p => { return <IconTemplate iconSrc={imgEnergy60} {...p.props} /> }
export const IconEnergy70: Component<{ props?: IconProps }> = p => { return <IconTemplate iconSrc={imgEnergy70} {...p.props} /> }
export const IconEnergy80: Component<{ props?: IconProps }> = p => { return <IconTemplate iconSrc={imgEnergy80} {...p.props} /> }
export const IconEnergy90: Component<{ props?: IconProps }> = p => { return <IconTemplate iconSrc={imgEnergy90} {...p.props} /> }
export const IconEnergy100: Component<{ props?: IconProps }> = p => { return <IconTemplate iconSrc={imgEnergy100} {...p.props} /> }


// From Solid-Icons
export function FiUser(props) {
  return (
    <svg fill="none" stroke-width="2" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="overflow: visible; color: currentcolor;" height="1em" width="1em"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><path d="M12 3A4 4 0 1 0 12 11 4 4 0 1 0 12 3z"></path></svg>
  );
}
