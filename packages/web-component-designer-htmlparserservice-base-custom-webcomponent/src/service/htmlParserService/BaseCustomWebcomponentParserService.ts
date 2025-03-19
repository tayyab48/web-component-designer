import { IHtmlParserService, ServiceContainer, InstanceServiceContainer, IDesignItem } from '@node-projects/web-component-designer';
import type { SourceFile } from 'typescript'

function* findAllNodesOfKind(node: ts.Node, kind: ts.SyntaxKind) {
  if (node.kind == kind)
    yield node;
  for (const c of node.getChildren())
    yield* findAllNodesOfKind(c, kind);
}

export class BaseCustomWebcomponentParserService implements IHtmlParserService {
  private htmlParser: IHtmlParserService;

  constructor(htmlParser: IHtmlParserService) {
    this.htmlParser = htmlParser;
  }

  async parse(code: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, parseSnippet: boolean): Promise<IDesignItem[]> {
    const sourceFile = this.parseTypescriptFile(code);

    let htmlCode = "";
    let cssStyle = "";
    let positionOffset = 0;
    //let cssOffset = 0;
    const nodes = findAllNodesOfKind(sourceFile, ts.SyntaxKind.TaggedTemplateExpression);
    for (let nd of nodes) {
      if (nd.tag.escapedText == 'html' && nd.parent.name.escapedText == "template") {
        positionOffset = nd.pos;
        htmlCode = nd.template.rawText;
      }
      if (nd.tag.escapedText == 'css' && nd.parent.name.escapedText == "style") {
        //cssOffset = nd.pos;
        cssStyle = nd.template.rawText;
      }
    }

    if (cssStyle)
      instanceServiceContainer.stylesheetService.setStylesheets([{ name: 'css', content: cssStyle }]);

    return this.htmlParser.parse(htmlCode, serviceContainer, instanceServiceContainer, parseSnippet, positionOffset);
  }

  public writeBack(code: string, html: string, css: string, newLineCrLf: boolean): string {
    const sourceFile = this.parseTypescriptFile(code);


    const transformTemplateLiterals = <T extends ts.Node>(context: ts.TransformationContext) =>
      (rootNode: T) => {
        function visit(node: ts.Node): ts.Node {

          if (ts.isTemplateLiteral(node) &&
            ts.isTaggedTemplateExpression(node.parent) &&
            (<any>node.parent.tag).escapedText == 'html' &&
            (<any>node.parent.parent).name.escapedText == "template") {
            return <ts.Node>ts.factory.createNoSubstitutionTemplateLiteral(html.replaceAll('\n', '\r\n'), html.replaceAll('\n', '\r\n'));
          } else if (css &&
            ts.isTemplateLiteral(node) &&
            ts.isTaggedTemplateExpression(node.parent) &&
            (<any>node.parent.tag).escapedText == 'css' &&
            (<any>node.parent.parent).name.escapedText == "style") {
            return <ts.Node>ts.factory.createNoSubstitutionTemplateLiteral(css.replaceAll('\n', '\r\n'), css.replaceAll('\n', '\r\n'));
          }
          return ts.visitEachChild(node, visit, context);
        }
        return ts.visitNode(rootNode, visit);
      };
    let transformed = ts.transform(sourceFile, [transformTemplateLiterals]).transformed[0];
    const printer = ts.createPrinter({ newLine: newLineCrLf ? ts.NewLineKind.CarriageReturnLineFeed : ts.NewLineKind.LineFeed });
    const result = printer.printNode(ts.EmitHint.Unspecified, transformed, <SourceFile>transformed);

    return result;
  }

  private parseTypescriptFile(code: string) {
    const compilerHost: ts.CompilerHost = {
      fileExists: () => true,
      getCanonicalFileName: filename => filename,
      getCurrentDirectory: () => '',
      getDefaultLibFileName: () => 'lib.d.ts',
      getNewLine: () => '\n',
      getSourceFile: filename => {
        return ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true);
      },
      readFile: () => null,
      useCaseSensitiveFileNames: () => true,
      writeFile: () => null,
    };

    const filename = 'aa.ts';
    const program = ts.createProgram([filename], {
      noResolve: true,
      target: ts.ScriptTarget.Latest,
    }, compilerHost);

    const sourceFile = program.getSourceFile(filename);
    return sourceFile;
  }
}