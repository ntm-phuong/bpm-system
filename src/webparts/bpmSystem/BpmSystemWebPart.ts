import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'BpmSystemWebPartStrings';
import BpmSystem from './components/BpmSystem';
import { IBpmSystemProps } from './components/IBpmSystemProps';
import { initPnP } from '../../config/pnpConfig';
import { initializeIcons } from '@fluentui/react/lib/Icons';

export interface IBpmSystemWebPartProps {
  description: string;
}

export default class BpmSystemWebPart extends BaseClientSideWebPart<IBpmSystemWebPartProps> {

  protected async onInit(): Promise<void> {
    // 1. Khởi tạo PnPJS
    initPnP(this.context);
    // 2. Khởi tạo Icons cho Fluent UI
    initializeIcons();
    
    return super.onInit();
  }

  public render(): void {
    const element = React.createElement(
      BpmSystem as React.ComponentType<IBpmSystemProps>,
      {
        description: this.properties.description,
        userDisplayName: this.context.pageContext.user.displayName,
        context: this.context // Có thể truyền thêm context nếu các component con cần gọi API thuần
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}