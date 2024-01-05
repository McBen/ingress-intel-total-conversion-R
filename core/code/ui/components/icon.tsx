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


export function FiShield(props) {
  return (
    <svg fill="none" stroke-width="2" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="overflow: visible; color: currentcolor;" height="1em" width="1em"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
  );
}

export function TbMoneybag(props) {
  return (
    <svg fill="none" stroke-width="2" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-moneybag" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="overflow: visible; color: currentcolor;"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M9.5 3h5a1.5 1.5 0 0 1 1.5 1.5a3.5 3.5 0 0 1 -3.5 3.5h-1a3.5 3.5 0 0 1 -3.5 -3.5a1.5 1.5 0 0 1 1.5 -1.5z"></path><path d="M4 17v-1a8 8 0 1 1 16 0v1a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z"></path></svg>
  );
}

export function TbVectorTriangle(props) {
  return (
    <svg fill="none" stroke-width="2" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-vector-triangle" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="overflow: visible; color: currentcolor;"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M10 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z"></path><path d="M3 17m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z"></path><path d="M17 17m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z"></path><path d="M6.5 17.1l5 -9.1"></path><path d="M17.5 17.1l-5 -9.1"></path><path d="M7 19l10 0"></path></svg>
  );
}

export function BiRegularTachometer(props) {
  return (
    <svg fill="currentColor" stroke-width="0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="overflow: visible; color: currentcolor;" height="1em" width="1em"><path d="M12 4C6.486 4 2 8.486 2 14a9.89 9.89 0 0 0 1.051 4.445c.17.34.516.555.895.555h16.107c.379 0 .726-.215.896-.555A9.89 9.89 0 0 0 22 14c0-5.514-4.486-10-10-10zm7.41 13H4.59A7.875 7.875 0 0 1 4 14c0-4.411 3.589-8 8-8s8 3.589 8 8a7.875 7.875 0 0 1-.59 3z"></path><path d="M10.939 12.939a1.53 1.53 0 0 0 0 2.561 1.53 1.53 0 0 0 2.121-.44l3.962-6.038a.034.034 0 0 0 0-.035.033.033 0 0 0-.045-.01l-6.038 3.962z"></path></svg>
  );
}

export function BiRegularRuler(props) {
  return (
    <svg fill="currentColor" stroke-width="0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="overflow: visible; color: currentcolor;" height="1em" width="1em"><path d="M20.875 7H3.125C1.953 7 1 7.897 1 9v6c0 1.103.953 2 2.125 2h17.75C22.047 17 23 16.103 23 15V9c0-1.103-.953-2-2.125-2zm0 8H3.125c-.057 0-.096-.016-.113-.016-.007 0-.011.002-.012.008l-.012-5.946c.007-.01.052-.046.137-.046H5v3h2V9h2v4h2V9h2v3h2V9h2v4h2V9h1.875c.079.001.122.028.125.008l.012 5.946c-.007.01-.052.046-.137.046z"></path></svg>
  );
}




