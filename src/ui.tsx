import {
  Bold,
  Container,
  Divider,
  Dropdown,
  DropdownOption,
  Muted,
  render,
  Text,
  Textbox,
  VerticalSpace
} from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { Fragment, h, JSX } from 'preact'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import { Cell, Row, Table } from './layout/Table'
import '!./styles.css'

import { CutType, FrameSelection, PathSelection, Selection, SelectionChangeHandler, SetDataHandler } from './types'
import { assertCutType } from './utils'
import { IconDepth16, IconGuide16, IconInside16, IconOnLine16, IconOutside16, IconPocket16 } from './icons'

const cutTypeOptions: DropdownOption[] = [{
  value: "inside",
  text: "Inside"
}, {
  value: "outside",
  text: "Outside"
}, {
  value: "on-line",
  text: "On Line"
}, {
  value: "pocket",
  text: "Pocket",
}, {
  value: "guide",
  text: "Guide",
}];

const mixedCutTypeOptions: DropdownOption[] = [{
  value: "Mixed",
  disabled: true,
  text: "Mixed"
}, {
  separator: true,
}, ...cutTypeOptions];

const clearOptions: DropdownOption[] = [{
  separator: true,
}, {
  value: "",
  text: "Clear"
}]

const cutTypeOptionsWithClear = [...cutTypeOptions, ...clearOptions]
const mixedCutTypeOptionsWithClear = [...mixedCutTypeOptions, ...clearOptions]

function Plugin() {
  const [selection, setSelection] = useState<Selection>()
  useEffect(() => {
    on<SelectionChangeHandler>('SELECTION_CHANGE', selection => {
      setSelection(selection)
      console.log(selection)
    })
  }, [])

  return (
    <Container space="medium">
      <VerticalSpace space="large" />
      {
        selection?.kind === 'PATHS' ? <PathSelectionEditor selection={selection} /> :
        selection?.kind === 'FRAME' ? <FrameSelectionEditor selection={selection} /> :
        null
      }
    </Container>
  )
}

interface PathSelectionEditorProps {
  selection: PathSelection
}

function PathSelectionEditor(props: PathSelectionEditorProps) {
  const { selection } = props
  const cutDepth = selection.nodes.every(node => node.cutDepth === selection.nodes[0].cutDepth)
    ? selection.nodes[0]?.cutDepth
    : "Mixed"
  const cutType = selection.nodes.every(node => node.cutType === selection.nodes[0].cutType)
    ? selection.nodes[0]?.cutType
    : "Mixed"
  return (
    <Fragment>
      {selection.nodes.length ? (
        <Fragment>
          {selection.nodes.length === 1
            ? <Text><Bold>{selection.nodes[0].name}</Bold></Text>
            : <Text><Bold>{selection.nodes.length} paths</Bold></Text>}
          <VerticalSpace space="medium" />
          <Table>
            <CutControls
              key={selection.nodes.map(node => node.id).join(',')}
              nodeIds={selection.nodes.map(node => node.id)}
              cutDepth={cutDepth?.toString()}
              cutType={cutType}
            />
          </Table>
        </Fragment>
      ) : null}
      {selection.invalidNodes.length > 0 && (
        <Fragment>
          {selection.nodes.length ? (
            <Fragment>
              <VerticalSpace space="medium" />
              <Divider />
              <VerticalSpace space="medium" />
            </Fragment>
          ) : null}
          <Text><Muted>
            Selection includes {selection.invalidNodes.length === 1 ? 'one object ' : `${selection.invalidNodes.length} objects `}
            that cannot be exported with cut data and will be ignored.
          </Muted></Text>
        </Fragment>
      )}
    </Fragment>
  )
}

interface FrameSelectionEditorProps {
  selection: FrameSelection
}

function FrameSelectionEditor(props: FrameSelectionEditorProps) {
  const { selection } = props
  return (
    <Fragment>
      <Text><Bold>{selection.frame.name}</Bold></Text>
      <VerticalSpace space="medium" />
      <Table>
        {selection.paths.nodes.map(node => (
          <CutControls
            key={node.id}
            nodeIds={[node.id]}
            label={node.name}
            cutDepth={node.cutDepth?.toString()}
            cutType={node.cutType}
          />
        ))}
      </Table>
    </Fragment>
  )
}

const noIcon16 = <span style={{ display: 'inline-block', width: 16, height: 16 }} />

interface CutControlsProps {
  nodeIds: readonly string[]
  label?: string
  cutDepth?: string
  cutType?: CutType | 'Mixed' | ''
}

function CutControls({ nodeIds, label, cutDepth: initialCutDepth, cutType: initialCutType }: CutControlsProps) {
  const [cutType, setCutType] = useState(initialCutType)
  const [cutDepth, setCutDepth] = useState(initialCutDepth)
  const onCutTypeChange = useCallback((event: JSX.TargetedEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    if (value !== "") {
      assertCutType(value)
    }
    setCutType(value)
    emit<SetDataHandler>('SET_DATA', { nodeIds, cutType: value })
  }, [nodeIds])
  const onCutDepthChange = useCallback((event: JSX.TargetedEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    setCutDepth(value)
    emit<SetDataHandler>('SET_DATA', { nodeIds, cutDepth: value })
  }, [nodeIds])
  const icon = useMemo(() => {
    switch (cutType) {
      case 'inside': return <IconInside16 />
      case 'outside': return <IconOutside16 />
      case 'on-line': return <IconOnLine16 />
      case 'pocket': return <IconPocket16 />
      case 'guide': return <IconGuide16 />
      default: return noIcon16
    }
  }, [cutType])

  const options = cutType === 'Mixed'
    ? cutType ? mixedCutTypeOptionsWithClear : mixedCutTypeOptions
    : cutType ? cutTypeOptionsWithClear : cutTypeOptions
  return (
    <Row>
      {label && <Cell><Text>{label}</Text></Cell>}
      <Cell width={80}>
        <Textbox
          icon={<IconDepth16 />}
          placeholder="Depth"
          value={cutDepth ?? ""}
          onChange={onCutDepthChange}
        />
      </Cell>
      <Cell width={96}>
        <Dropdown
          icon={icon}
          placeholder="Cut type"
          options={options}
          value={cutType || null}
          onChange={onCutTypeChange}
        />
      </Cell>
    </Row>
  )
}

export default render(Plugin)
