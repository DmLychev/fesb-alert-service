import {
  Button,
  Dialog,
  Field,
  Fieldset,
  HStack,
  Input,
  NativeSelect,
  Portal,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";

import { useEffect, useMemo, useState } from "react";

import { fetchSubscriptionOptions } from "../api/fetchSubscriptionOptions";
import { createNotificationSubscription } from "../api/notificationReceiverMutations";

import type {
  CreateSubscriptionInput,
  NotificationScope,
  SubscriptionOptions,
} from "../types";

import { toaster } from "../../../components/ui/toaster";

import SubscriptionMultiSelect from "./SubscriptionMultiSelect";

interface CreateSubscriptionDialogProps {
  open: boolean;

  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

type IssueTypeSelectionMode = "ALL" | "SELECTED";

const SCOPE_DESCRIPTIONS: Record<NotificationScope, string> = {
  GLOBAL: "Получать выбранные типы ошибок независимо от домена или СОПС.",

  DOMAIN: "Получать ошибки, относящиеся к выбранным доменам.",

  ROUTE: "Получать ошибки только для выбранных СОПС.",
};

const CreateSubscriptionDialog = ({
  open,
  onOpenChange,
  onCreated,
}: CreateSubscriptionDialogProps) => {
  const [options, setOptions] = useState<SubscriptionOptions | null>(null);

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState("");

  const [scope, setScope] = useState<NotificationScope>("GLOBAL");

  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);

  const [selectedIssueTypeCodes, setSelectedIssueTypeCodes] = useState<
    number[]
  >([]);

  const [issueTypeSelectionMode, setIssueTypeSelectionMode] =
    useState<IssueTypeSelectionMode>("ALL");
  const allIssueTypes = issueTypeSelectionMode === "ALL";

  const resetForm = () => {
    setEmail("");
    setScope("GLOBAL");
    setSelectedDomains([]);
    setSelectedRouteIds([]);
    setSelectedIssueTypeCodes([]);
    setIssueTypeSelectionMode("ALL");
    setOptions(null);
    setOptionsError(null);
    setIsLoadingOptions(true);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();

    onOpenChange(nextOpen);
  };

  /*
   * Every time the dialog is opened:
   * - start with a clean form;
   * - fetch fresh routes/domains/issue types.
   */
  useEffect(() => {
    if (!open) return;

    let active = true;

    void fetchSubscriptionOptions()
      .then((result) => {
        if (!active) return;

        setOptions(result);
      })
      .catch((error: unknown) => {
        if (!active) return;

        setOptionsError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить параметры подписки",
        );
      })
      .finally(() => {
        if (!active) return;

        setIsLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  /*
   * Changing scope invalidates all selections made
   * for the previous scope.
   */
  const handleScopeChange = (nextScope: NotificationScope) => {
    setScope(nextScope);

    setSelectedDomains([]);
    setSelectedRouteIds([]);
    setSelectedIssueTypeCodes([]);
    setIssueTypeSelectionMode("ALL");
  };

  /*
   * The backend validates this too.
   * Filtering here is purely UX:
   *
   * GLOBAL -> GLOBAL + DOMAIN + ROUTE issue types
   * DOMAIN -> DOMAIN + ROUTE
   * ROUTE  -> ROUTE only
   */
  const applicableIssueTypes = useMemo(() => {
    const issueTypes = options?.issueTypes ?? [];

    if (scope === "GLOBAL") return issueTypes;

    if (scope === "DOMAIN")
      return issueTypes.filter(
        (issueType) =>
          issueType.scope === "DOMAIN" || issueType.scope === "ROUTE",
      );

    return issueTypes.filter((issueType) => issueType.scope === "ROUTE");
  }, [options, scope]);

  const domainOptions = useMemo(
    () =>
      (options?.domains ?? []).map((domain) => ({
        value: domain,
        label: domain,
      })),
    [options],
  );

  const routeOptions = useMemo(
    () =>
      (options?.routes ?? []).map((route) => ({
        value: route.id,
        label: route.name,
        description: route.domainName,
        searchText: route.id,
      })),
    [options],
  );

  const issueTypeOptions = useMemo(
    () =>
      applicableIssueTypes.map((issueType) => ({
        value: issueType.code,
        label: String(issueType.code),
        description: issueType.description,
      })),
    [applicableIssueTypes],
  );

  /*
   * One GLOBAL scope = one target.
   * DOMAIN / ROUTE may have many targets.
   */
  const targetCount =
    scope === "GLOBAL"
      ? 1
      : scope === "DOMAIN"
        ? selectedDomains.length
        : selectedRouteIds.length;

  /*
   * "All issue types" produces one DB rule with
   * issue_type = NULL, not one rule per IssueType.
   */
  const issueTypeCount = allIssueTypes ? 1 : selectedIssueTypeCodes.length;

  const rulesCount = targetCount * issueTypeCount;

  const canCreate =
    Boolean(options) &&
    !isLoadingOptions &&
    !isSubmitting &&
    email.trim().length > 0 &&
    targetCount > 0 &&
    (allIssueTypes || selectedIssueTypeCodes.length > 0);

  const handleCreate = async () => {
    if (!canCreate) return;

    const data: CreateSubscriptionInput = {
      email: email.trim(),
      scope,

      issueTypeCodes: allIssueTypes ? [] : selectedIssueTypeCodes,

      domainNames: scope === "DOMAIN" ? selectedDomains : [],

      routeIds: scope === "ROUTE" ? selectedRouteIds : [],

      allIssueTypes,
    };

    setIsSubmitting(true);

    try {
      const result = await createNotificationSubscription(data);

      toaster.create({
        title:
          result.createdCount > 0
            ? `Создано правил: ${result.createdCount}`
            : "Новых правил не создано",

        description:
          result.skippedDuplicates > 0
            ? `Уже существовало правил: ${result.skippedDuplicates}`
            : undefined,

        type: "success",
        duration: 4000,
      });

      handleOpenChange(false);
      onCreated();
    } catch (error: unknown) {
      toaster.create({
        title:
          error instanceof Error
            ? error.message
            : "Не удалось создать подписку",

        type: "error",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={({ open }) => handleOpenChange(open)}
      size="lg"
      placement="center"
      closeOnEscape={!isSubmitting}
      closeOnInteractOutside={!isSubmitting}
    >
      <Portal>
        <Dialog.Backdrop />

        <Dialog.Positioner>
          <Dialog.Content maxHeight="90vh">
            <Dialog.Header>
              <Dialog.Title>Добавить подписку</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body overflowY="auto">
              {isLoadingOptions ? (
                <HStack justify="center" py={10}>
                  <Spinner size="sm" />

                  <Text>Загрузка параметров...</Text>
                </HStack>
              ) : optionsError ? (
                <Text color="fg.error" py={4}>
                  {optionsError}
                </Text>
              ) : (
                <Stack gap={5}>
                  <Field.Root width="full">
                    <Field.Label>Email</Field.Label>

                    <Input
                      type="email"
                      value={email}
                      placeholder="support@example.com"
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Область подписки</Field.Label>

                    <NativeSelect.Root width="full">
                      <NativeSelect.Field
                        value={scope}
                        onChange={(event) =>
                          handleScopeChange(
                            event.target.value as NotificationScope,
                          )
                        }
                      >
                        <option value="GLOBAL">Везде</option>

                        <option value="DOMAIN">Выбранные домены</option>

                        <option value="ROUTE">Выбранные СОПС</option>
                      </NativeSelect.Field>

                      <NativeSelect.Indicator />
                    </NativeSelect.Root>

                    <Field.HelperText>
                      {SCOPE_DESCRIPTIONS[scope]}
                    </Field.HelperText>
                  </Field.Root>

                  {scope === "DOMAIN" && (
                    <Fieldset.Root>
                      <Fieldset.Legend>Домены</Fieldset.Legend>

                      <Fieldset.Content width="full">
                        <SubscriptionMultiSelect
                          options={domainOptions}
                          selected={selectedDomains}
                          onChange={setSelectedDomains}
                          emptyText="Домены не найдены"
                        />
                      </Fieldset.Content>
                    </Fieldset.Root>
                  )}

                  {scope === "ROUTE" && (
                    <Fieldset.Root>
                      <Fieldset.Legend>СОПС</Fieldset.Legend>

                      <Fieldset.Content width="full">
                        <SubscriptionMultiSelect
                          options={routeOptions}
                          selected={selectedRouteIds}
                          onChange={setSelectedRouteIds}
                          emptyText="СОПС не найдены"
                          maxHeight="260px"
                        />
                      </Fieldset.Content>
                    </Fieldset.Root>
                  )}

                  <Field.Root width="full">
                    <Field.Label>Типы ошибок</Field.Label>

                    <NativeSelect.Root width="full">
                      <NativeSelect.Field
                        width="full"
                        value={issueTypeSelectionMode}
                        onChange={(event) => {
                          const nextMode = event.target
                            .value as IssueTypeSelectionMode;

                          setIssueTypeSelectionMode(nextMode);

                          if (nextMode === "ALL") setSelectedIssueTypeCodes([]);
                        }}
                      >
                        <option value="ALL">Все применимые</option>
                        <option value="SELECTED">Выбранные</option>
                      </NativeSelect.Field>

                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>

                  {issueTypeSelectionMode === "SELECTED" && (
                    <Fieldset.Root width="full">
                      <Fieldset.Legend>Выьерите типы ошибок</Fieldset.Legend>

                      <Fieldset.Content width="full">
                        <SubscriptionMultiSelect
                          options={issueTypeOptions}
                          selected={selectedIssueTypeCodes}
                          onChange={setSelectedIssueTypeCodes}
                          emptyText="Типы ошибок не найдены"
                        />
                      </Fieldset.Content>
                    </Fieldset.Root>
                  )}

                  <Text
                    fontSize="sm"
                    color={rulesCount > 0 ? "fg" : "fg.muted"}
                  >
                    Будет создано правил: <strong>{rulesCount}</strong>
                  </Text>
                </Stack>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <HStack>
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => handleOpenChange(false)}
                >
                  Отмена
                </Button>

                <Button
                  disabled={!canCreate}
                  loading={isSubmitting}
                  onClick={() => void handleCreate()}
                >
                  Создать
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default CreateSubscriptionDialog;
